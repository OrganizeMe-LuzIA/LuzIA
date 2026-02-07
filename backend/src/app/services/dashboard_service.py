from collections import Counter
from datetime import datetime
from typing import Any, Dict, List, Optional

from bson import ObjectId
from bson.errors import InvalidId

from app.core.database import get_db
from app.core.cache import cache
from app.core.config import settings
from app.models.dashboard import (
    AlertaDashboard,
    DashboardOverview,
    DimensaoCritica,
    OrganizacaoDashboard,
    OrganizacaoDetalhada,
    OrganizacaoResumo,
    ProgressoUsuario,
    QuestionarioMetricas,
    QuestionarioResumo,
    QuestionarioStatus,
    SetorDashboard,
    SetorDetalhado,
    SetorResumo,
    UsuarioAtivo,
    UsuarioResumo,
)
from app.repositories.perguntas import PerguntasRepo


class DashboardService:
    def __init__(self):
        self._perguntas_repo = PerguntasRepo()

    def _to_object_id(self, value: str) -> Optional[ObjectId]:
        try:
            return ObjectId(value)
        except InvalidId:
            return None

    def _mask_phone(self, phone: str) -> str:
        if not phone:
            return "******"
        suffix = phone[-4:] if len(phone) >= 4 else phone
        return f"*****{suffix}"

    def _as_str_id(self, value: Any) -> str:
        return str(value) if value is not None else ""

    def _extract_classificacao(self, value: Any) -> str:
        if hasattr(value, "value"):
            return str(value.value)
        return str(value or "intermediario")

    async def list_organizacoes(self) -> List[OrganizacaoDashboard]:
        db = await get_db()
        orgs = await db["organizacoes"].find().to_list(length=1000)
        results: List[OrganizacaoDashboard] = []

        for org in orgs:
            org_id = org["_id"]
            setores = await db["setores"].count_documents({"idOrganizacao": org_id})
            users = await db["usuarios"].find({"idOrganizacao": org_id}).to_list(length=2000)
            total_usuarios = len(users)
            usuarios_ativos = sum(1 for u in users if u.get("status") == "ativo")
            anon_ids = [u.get("anonId") for u in users if u.get("anonId")]
            if anon_ids:
                respostas_docs = await db["respostas"].find({"anonId": {"$in": anon_ids}}).to_list(length=5000)
            else:
                respostas_docs = []
            q_ids = {str(r.get("idQuestionario")) for r in respostas_docs if r.get("idQuestionario")}
            finalizados = sum(1 for u in users if u.get("respondido") is True)
            taxa = round((finalizados / total_usuarios) * 100, 2) if total_usuarios else 0.0

            results.append(
                OrganizacaoDashboard(
                    id=str(org_id),
                    cnpj=org.get("cnpj", ""),
                    nome=org.get("nome", ""),
                    total_setores=setores,
                    total_usuarios=total_usuarios,
                    usuarios_ativos=usuarios_ativos,
                    questionarios_em_andamento=len(q_ids),
                    taxa_conclusao=taxa,
                )
            )
        return results

    async def get_organizacao_detalhada(self, org_id: str) -> Optional[OrganizacaoDetalhada]:
        db = await get_db()
        oid = self._to_object_id(org_id)
        if not oid:
            return None
        org = await db["organizacoes"].find_one({"_id": oid})
        if not org:
            return None

        setores_docs = await db["setores"].find({"idOrganizacao": oid}).to_list(length=500)
        users = await db["usuarios"].find({"idOrganizacao": oid}).to_list(length=5000)
        status_counter = Counter(u.get("status", "desconhecido") for u in users)

        setor_users_counter: Dict[str, Dict[str, int]] = {}
        for s in setores_docs:
            sid = str(s["_id"])
            related = [u for u in users if str(u.get("idSetor")) == sid]
            setor_users_counter[sid] = {
                "total": len(related),
                "ativos": sum(1 for u in related if u.get("status") == "ativo"),
            }

        setores = [
            SetorResumo(
                id=str(s["_id"]),
                nome=s.get("nome", ""),
                total_usuarios=setor_users_counter[str(s["_id"])]["total"],
                usuarios_ativos=setor_users_counter[str(s["_id"])]["ativos"],
            )
            for s in setores_docs
        ]

        anon_ids = [u.get("anonId") for u in users if u.get("anonId")]
        respostas_docs = await db["respostas"].find({"anonId": {"$in": anon_ids}}).to_list(length=5000) if anon_ids else []
        questionarios = await db["questionarios"].find().to_list(length=300)
        questionario_map = {str(q["_id"]): q for q in questionarios}
        by_q: Dict[str, List[Dict[str, Any]]] = {}
        for r in respostas_docs:
            qid = str(r.get("idQuestionario"))
            by_q.setdefault(qid, []).append(r)

        questionarios_status: List[QuestionarioResumo] = []
        for qid, items in by_q.items():
            q = questionario_map.get(qid, {})
            concluidos = sum(1 for u in users if u.get("respondido"))
            taxa = round((concluidos / len(users)) * 100, 2) if users else 0.0
            questionarios_status.append(
                QuestionarioResumo(
                    id=qid,
                    nome=q.get("nome", "Questionário"),
                    versao=q.get("versao", ""),
                    codigo=q.get("codigo"),
                    taxa_conclusao=taxa,
                )
            )

        return OrganizacaoDetalhada(
            id=str(org["_id"]),
            cnpj=org.get("cnpj", ""),
            nome=org.get("nome", ""),
            setores=setores,
            usuarios_por_status=dict(status_counter),
            questionarios_status=questionarios_status,
        )

    async def list_setores(self, org_id: Optional[str] = None) -> List[SetorDashboard]:
        db = await get_db()
        query: Dict[str, Any] = {}
        if org_id:
            oid = self._to_object_id(org_id)
            if not oid:
                return []
            query["idOrganizacao"] = oid
        setores = await db["setores"].find(query).to_list(length=1000)
        orgs = await db["organizacoes"].find().to_list(length=1000)
        org_map = {str(o["_id"]): o.get("nome", "Organização") for o in orgs}
        results: List[SetorDashboard] = []

        for setor in setores:
            sid = setor["_id"]
            users = await db["usuarios"].find({"idSetor": sid}).to_list(length=3000)
            total = len(users)
            ativos = sum(1 for u in users if u.get("status") == "ativo")
            respondidos = sum(1 for u in users if u.get("respondido"))
            taxa = round((respondidos / total) * 100, 2) if total else 0.0
            results.append(
                SetorDashboard(
                    id=str(sid),
                    nome=setor.get("nome", ""),
                    organizacao_nome=org_map.get(str(setor.get("idOrganizacao")), "Organização"),
                    total_usuarios=total,
                    usuarios_ativos=ativos,
                    taxa_resposta=taxa,
                )
            )
        return results

    async def get_setor_detalhado(self, setor_id: str) -> Optional[SetorDetalhado]:
        db = await get_db()
        sid = self._to_object_id(setor_id)
        if not sid:
            return None
        setor = await db["setores"].find_one({"_id": sid})
        if not setor:
            return None
        org = await db["organizacoes"].find_one({"_id": setor.get("idOrganizacao")})
        users = await db["usuarios"].find({"idSetor": sid}).to_list(length=5000)
        anon_ids = [u.get("anonId") for u in users if u.get("anonId")]
        respostas_docs = await db["respostas"].find({"anonId": {"$in": anon_ids}}).to_list(length=5000) if anon_ids else []
        by_q = Counter(str(r.get("idQuestionario")) for r in respostas_docs if r.get("idQuestionario"))
        total_users = len(users) or 1
        progresso_questionarios = {
            qid: round((count / total_users) * 100, 2) for qid, count in by_q.items()
        }
        usuario_resumos = [
            UsuarioResumo(
                id=str(u["_id"]),
                anon_id=u.get("anonId", ""),
                status=u.get("status", "desconhecido"),
                respondido=bool(u.get("respondido", False)),
            )
            for u in users
        ]

        return SetorDetalhado(
            id=str(setor["_id"]),
            nome=setor.get("nome", ""),
            descricao=setor.get("descricao"),
            organizacao=OrganizacaoResumo(
                id=self._as_str_id(org.get("_id") if org else ""),
                nome=org.get("nome", "Organização") if org else "Organização",
                cnpj=org.get("cnpj", "") if org else "",
            ),
            usuarios=usuario_resumos,
            progresso_questionarios=progresso_questionarios,
        )

    async def list_usuarios_ativos(
        self,
        org_id: Optional[str] = None,
        setor_id: Optional[str] = None,
    ) -> List[UsuarioAtivo]:
        db = await get_db()
        query: Dict[str, Any] = {"status": "ativo"}
        if org_id:
            oid = self._to_object_id(org_id)
            if not oid:
                return []
            query["idOrganizacao"] = oid
        if setor_id:
            sid = self._to_object_id(setor_id)
            if not sid:
                return []
            query["idSetor"] = sid

        users = await db["usuarios"].find(query).to_list(length=3000)
        orgs = await db["organizacoes"].find().to_list(length=1000)
        setores = await db["setores"].find().to_list(length=1000)
        org_map = {str(o["_id"]): o.get("nome", "Organização") for o in orgs}
        setor_map = {str(s["_id"]): s.get("nome", "Setor") for s in setores}
        questionarios = await db["questionarios"].find().to_list(length=300)
        q_map = {str(q["_id"]): q for q in questionarios}

        items: List[UsuarioAtivo] = []
        for user in users:
            anon_id = user.get("anonId")
            resposta = None
            if anon_id:
                resposta = await db["respostas"].find_one(
                    {"anonId": anon_id},
                    sort=[("data", -1)],
                )
            qid = str(resposta.get("idQuestionario")) if resposta and resposta.get("idQuestionario") else None
            total_perguntas = await self._perguntas_repo.count_questions(qid) if qid else 0
            respondidas = len(resposta.get("respostas", [])) if resposta else 0
            progresso = round((respondidas / total_perguntas) * 100, 2) if total_perguntas else 0.0
            ultima = user.get("ultimoAcesso") or user.get("dataCadastro") or datetime.utcnow()
            items.append(
                UsuarioAtivo(
                    id=str(user["_id"]),
                    telefone_mascarado=self._mask_phone(user.get("telefone", "")),
                    status=user.get("status", "ativo"),
                    progresso_atual=progresso,
                    questionario_em_andamento=q_map.get(qid, {}).get("nome") if qid else None,
                    ultima_atividade=ultima,
                    organizacao=org_map.get(str(user.get("idOrganizacao")), "Organização"),
                    setor=setor_map.get(str(user.get("idSetor"))) if user.get("idSetor") else None,
                )
            )
        return items

    async def get_usuario_progresso(self, user_id: str) -> Optional[ProgressoUsuario]:
        db = await get_db()
        uid = self._to_object_id(user_id)
        if not uid:
            return None
        user = await db["usuarios"].find_one({"_id": uid})
        if not user:
            return None
        anon_id = user.get("anonId")
        if not anon_id:
            return None
        resposta = await db["respostas"].find_one({"anonId": anon_id}, sort=[("data", -1)])
        if not resposta:
            return ProgressoUsuario(
                id=str(uid),
                questionario_nome="Sem respostas",
                perguntas_respondidas=0,
                total_perguntas=0,
                percentual_conclusao=0.0,
                tempo_estimado_restante=None,
                ultima_resposta=None,
            )

        qid = str(resposta.get("idQuestionario")) if resposta.get("idQuestionario") else ""
        q_oid = self._to_object_id(qid) if qid else None
        questionario = await db["questionarios"].find_one({"_id": q_oid}) if q_oid else None
        total = await self._perguntas_repo.count_questions(qid)
        respondidas = len(resposta.get("respostas", []))
        percentual = round((respondidas / total) * 100, 2) if total else 0.0
        restantes = max(total - respondidas, 0)
        tempo_min = max(restantes, 0)
        tempo_estimado = f"{tempo_min} minutos" if tempo_min > 0 else "Concluído"

        return ProgressoUsuario(
            id=str(uid),
            questionario_nome=questionario.get("nome", "Questionário") if questionario else "Questionário",
            perguntas_respondidas=respondidas,
            total_perguntas=total,
            percentual_conclusao=percentual,
            tempo_estimado_restante=tempo_estimado,
            ultima_resposta=resposta.get("data"),
        )

    async def list_questionarios_status(self) -> List[QuestionarioStatus]:
        db = await get_db()
        questionarios = await db["questionarios"].find().to_list(length=300)
        total_usuarios = await db["usuarios"].count_documents({})
        resultados: List[QuestionarioStatus] = []
        for q in questionarios:
            qid = str(q["_id"])
            respostas = await db["respostas"].find({"idQuestionario": q["_id"]}).to_list(length=5000)
            completos = len([r for r in respostas if r.get("respostas")])
            taxa = round((completos / total_usuarios) * 100, 2) if total_usuarios else 0.0
            resultados.append(
                QuestionarioStatus(
                    id=qid,
                    nome=q.get("nome", ""),
                    versao=q.get("versao", ""),
                    codigo=q.get("codigo"),
                    total_usuarios_atribuidos=total_usuarios,
                    total_respostas_completas=completos,
                    taxa_conclusao=taxa,
                    tempo_medio_conclusao=None,
                )
            )
        return resultados

    async def get_questionario_metricas(self, questionario_id: str) -> Optional[QuestionarioMetricas]:
        db = await get_db()
        qid = self._to_object_id(questionario_id)
        if not qid:
            return None
        q = await db["questionarios"].find_one({"_id": qid})
        if not q:
            return None

        diags = await db["diagnosticos"].find({"idQuestionario": qid}).to_list(length=10000)
        dist = Counter(self._extract_classificacao(d.get("resultadoGlobal")) for d in diags)

        dims = Counter()
        for d in diags:
            for dim in d.get("dimensoes", []):
                if self._extract_classificacao(dim.get("classificacao")) == "risco":
                    dims[dim.get("dimensao", "Sem dimensão")] += 1
        criticas = [
            DimensaoCritica(dimensao=nome, total_risco=total)
            for nome, total in dims.most_common(5)
        ]

        respostas = await db["respostas"].find({"idQuestionario": qid}).to_list(length=10000)
        anon_ids = list({r.get("anonId") for r in respostas if r.get("anonId")})
        users = await db["usuarios"].find({"anonId": {"$in": anon_ids}}).to_list(length=10000) if anon_ids else []
        org_ids = list({u.get("idOrganizacao") for u in users if u.get("idOrganizacao")})
        setor_ids = list({u.get("idSetor") for u in users if u.get("idSetor")})
        orgs = await db["organizacoes"].find({"_id": {"$in": org_ids}}).to_list(length=1000) if org_ids else []
        setores = await db["setores"].find({"_id": {"$in": setor_ids}}).to_list(length=1000) if setor_ids else []

        return QuestionarioMetricas(
            id=str(q["_id"]),
            nome=q.get("nome", ""),
            distribuicao_classificacoes={
                "favoravel": int(dist.get("favoravel", 0)),
                "intermediario": int(dist.get("intermediario", 0)),
                "risco": int(dist.get("risco", 0)),
            },
            dimensoes_criticas=criticas,
            organizacoes_participantes=[o.get("nome", "Organização") for o in orgs],
            setores_participantes=[s.get("nome", "Setor") for s in setores],
        )

    async def get_overview(self) -> DashboardOverview:
        cached = await cache.get("dashboard:overview")
        if cached:
            return DashboardOverview(**cached)

        db = await get_db()
        total_organizacoes = await db["organizacoes"].count_documents({})
        total_setores = await db["setores"].count_documents({})
        total_usuarios = await db["usuarios"].count_documents({})
        usuarios_ativos = await db["usuarios"].count_documents({"status": "ativo"})
        questionarios = await db["questionarios"].find().to_list(length=500)
        questionarios_em_andamento = 0
        for q in questionarios:
            respostas = await db["respostas"].count_documents({"idQuestionario": q["_id"]})
            if respostas > 0:
                questionarios_em_andamento += 1

        concluidos = await db["usuarios"].count_documents({"respondido": True})
        taxa_conclusao = round((concluidos / total_usuarios) * 100, 2) if total_usuarios else 0.0

        alertas: List[AlertaDashboard] = []
        if taxa_conclusao < 50 and total_usuarios > 0:
            alertas.append(
                AlertaDashboard(
                    tipo="baixa_taxa_conclusao",
                    mensagem="Taxa geral de conclusão abaixo de 50%.",
                    severidade="media",
                    entidades_afetadas=["sistema"],
                )
            )

        diags = await db["diagnosticos"].find().to_list(length=5000)
        risco_count = 0
        for d in diags:
            risco_count += sum(
                1 for dim in d.get("dimensoes", [])
                if self._extract_classificacao(dim.get("classificacao")) == "risco"
            )
        if risco_count > 0:
            alertas.append(
                AlertaDashboard(
                    tipo="dimensao_risco",
                    mensagem=f"Foram identificadas {risco_count} ocorrências em risco.",
                    severidade="alta" if risco_count > 20 else "media",
                    entidades_afetadas=["diagnosticos"],
                )
            )

        result = DashboardOverview(
            total_organizacoes=total_organizacoes,
            total_setores=total_setores,
            total_usuarios=total_usuarios,
            usuarios_ativos=usuarios_ativos,
            questionarios_em_andamento=questionarios_em_andamento,
            taxa_conclusao_geral=taxa_conclusao,
            alertas=alertas,
            ultima_atualizacao=datetime.utcnow(),
        )
        await cache.set("dashboard:overview", result.model_dump(), ttl=settings.CACHE_TTL)
        return result
