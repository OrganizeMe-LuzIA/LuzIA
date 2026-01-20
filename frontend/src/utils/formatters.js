/**
 * Formata telefone para padrão brasileiro
 * @param {string} phone - Telefone no formato +5511999999999
 * @returns {string} - Telefone formatado (11) 99999-9999
 */
export function formatPhone(phone) {
    if (!phone) return ''
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 13) {
        // +55 11 99999-9999
        return `(${cleaned.substr(2, 2)}) ${cleaned.substr(4, 5)}-${cleaned.substr(9, 4)}`
    }
    return phone
}

/**
 * Formata CNPJ
 * @param {string} cnpj - CNPJ sem formatação
 * @returns {string} - CNPJ formatado XX.XXX.XXX/XXXX-XX
 */
export function formatCNPJ(cnpj) {
    if (!cnpj) return ''
    const cleaned = cnpj.replace(/\D/g, '')
    if (cleaned.length === 14) {
        return `${cleaned.substr(0, 2)}.${cleaned.substr(2, 3)}.${cleaned.substr(5, 3)}/${cleaned.substr(8, 4)}-${cleaned.substr(12, 2)}`
    }
    return cnpj
}

/**
 * Formata data para padrão brasileiro
 * @param {string|Date} date - Data
 * @returns {string} - Data formatada DD/MM/YYYY
 */
export function formatDate(date) {
    if (!date) return ''
    const d = new Date(date)
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}/${month}/${year}`
}

/**
 * Formata data e hora para padrão brasileiro
 * @param {string|Date} date - Data/hora
 * @returns {string} - Data formatada DD/MM/YYYY HH:mm
 */
export function formatDateTime(date) {
    if (!date) return ''
    const d = new Date(date)
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    return `${day}/${month}/${year} ${hours}:${minutes}`
}

/**
 * Valida CNPJ
 * @param {string} cnpj - CNPJ para validar
 * @returns {boolean} - true se válido
 */
export function validateCNPJ(cnpj) {
    cnpj = cnpj.replace(/\D/g, '')

    if (cnpj.length !== 14) return false

    // Elimina CNPJs invalidos conhecidos
    if (/^(\d)\1+$/.test(cnpj)) return false

    // Validação dos dígitos verificadores
    let tamanho = cnpj.length - 2
    let numeros = cnpj.substring(0, tamanho)
    const digitos = cnpj.substring(tamanho)
    let soma = 0
    let pos = tamanho - 7

    for (let i = tamanho; i >= 1; i--) {
        soma += numeros.charAt(tamanho - i) * pos--
        if (pos < 2) pos = 9
    }

    let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11)
    if (resultado != digitos.charAt(0)) return false

    tamanho = tamanho + 1
    numeros = cnpj.substring(0, tamanho)
    soma = 0
    pos = tamanho - 7

    for (let i = tamanho; i >= 1; i--) {
        soma += numeros.charAt(tamanho - i) * pos--
        if (pos < 2) pos = 9
    }

    resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11)
    if (resultado != digitos.charAt(1)) return false

    return true
}

/**
 * Trunca texto com reticências
 * @param {string} text - Texto para truncar
 * @param {number} length - Tamanho máximo
 * @returns {string} - Texto truncado
 */
export function truncate(text, length = 50) {
    if (!text) return ''
    if (text.length <= length) return text
    return text.substring(0, length) + '...'
}
