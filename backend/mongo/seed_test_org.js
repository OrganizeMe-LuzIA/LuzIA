
// Script to ensure test org and sector exist
var org = db.organizacoes.findOne({ codigo: 'TESTE' });
if (!org) {
    print("Creating organization...");
    var res = db.organizacoes.insertOne({
        nome: 'Empresa Teste',
        cnpj: '00.000.000/0001-00',
        codigo: 'TESTE'
    });
    org = db.organizacoes.findOne({ _id: res.insertedId });
} else {
    print("Organization found: " + org.nome);
}

var setor = db.setores.findOne({ idOrganizacao: org._id });
if (!setor) {
    print("Creating sectors...");
    db.setores.insertOne({ idOrganizacao: org._id, nome: 'TI' });
    db.setores.insertOne({ idOrganizacao: org._id, nome: 'RH' });
} else {
    print("Sectors found.");
}

print("Org ID: " + org._id.toString());
