// Objeto para armazenar os dados do cálculo para o relatório
let summaryData = {};

// Função para formatar valores como moeda brasileira (BRL)
const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
};

// Função para parsear valor do input
const parseInput = (value) => {
    if (!value) return 0;
    const numberValue = parseFloat(value.replace(/\./g, '').replace(',', '.'));
    return isNaN(numberValue) ? 0 : numberValue;
};

// Função para formatar input de moeda enquanto o usuário digita
const formatCurrencyInput = (inputElement) => {
    let value = inputElement.value.replace(/\D/g, "");
    value = value.replace(/(\d)(\d{2})$/, "$1,$2");
    value = value.replace(/(?=(\d{3})+(\D))\B/g, ".");
    inputElement.value = value;
};

// Função principal para calcular o salário
const calculateSalary = () => {
    // Jornada de Trabalho
    const workloadDivisor = parseInt(document.getElementById('workload').value);
    const workloadLabel = document.getElementById('workload').options[document.getElementById('workload').selectedIndex].text;

    // Vencimentos e Descontos Fixos
    const baseSalary = parseInput(document.getElementById('baseSalary').value);
    const overtimeHours = parseInput(document.getElementById('overtimeHours').value);
    const healthInsurance = parseInput(document.getElementById('healthInsurance').value);
    
    // Soma dos Outros Descontos dinâmicos
    let otherDiscounts = 0;
    document.querySelectorAll('.discount-row .value-field input').forEach(input => {
        otherDiscounts += parseInput(input.value);
    });
    
    // Apuração do Mês para DSR
    const workingDays = parseInput(document.getElementById('workingDays').value);
    const sundaysAndHolidays = parseInput(document.getElementById('sundaysAndHolidays').value);

    // --- CÁLCULOS ---
    // 1. Valor da Hora (baseado na jornada selecionada)
    const hourlyRate = baseSalary > 0 ? baseSalary / workloadDivisor : 0;
    const overtimeHourlyRate = hourlyRate * 1.75;
    const overtimeValue = overtimeHours * overtimeHourlyRate;

    // 2. DSR sobre Horas Extras
    const dsrValue = workingDays > 0 ? (overtimeValue / workingDays) * sundaysAndHolidays : 0;

    // 3. Salário Bruto (Salário Base + Horas Extras + DSR)
    const grossSalary = baseSalary + overtimeValue + dsrValue;

    // 4. Cálculo INSS com dedução por faixa
    let inssDiscount = 0;
    let inssBracketInfo = "";
    // Tabela INSS (Valores de 2025)
    if (grossSalary <= 1518.00) { 
        inssDiscount = grossSalary * 0.075;
        inssBracketInfo = "Faixa 1: 7,5%";
    } 
    else if (grossSalary <= 2793.88) { 
        inssDiscount = (grossSalary * 0.09) - 22.77;
        inssBracketInfo = "Faixa 2: 9%";
    } 
    else if (grossSalary <= 4190.83) { 
        inssDiscount = (grossSalary * 0.12) - 106.59;
        inssBracketInfo = "Faixa 3: 12%";
    } 
    else if (grossSalary <= 8157.41) { 
        inssDiscount = (grossSalary * 0.14) - 190.40;
        inssBracketInfo = "Faixa 4: 14%";
    } 
    else { 
        inssDiscount = 951.62; // Teto de contribuição 2025
        inssBracketInfo = "Teto de Contribuição";
    }

    // 5. Cálculo IRRF com dedução por faixa
    const irrfBase = grossSalary - inssDiscount;
    let irrfDiscount = 0;
    let irrfBracketInfo = "";
    // Tabela IRRF (Valores de 2025)
    if (irrfBase <= 2428.80) { 
        irrfDiscount = 0; 
        irrfBracketInfo = "Isento";
    } 
    else if (irrfBase <= 2826.65) { 
        irrfDiscount = (irrfBase * 0.075) - 182.16; 
        irrfBracketInfo = `7,5% (Deduzir ${formatCurrency(182.16)})`;
    } 
    else if (irrfBase <= 3751.05) { 
        irrfDiscount = (irrfBase * 0.15) - 394.16; 
        irrfBracketInfo = `15% (Deduzir ${formatCurrency(394.16)})`;
    } 
    else if (irrfBase <= 4664.68) { 
        irrfDiscount = (irrfBase * 0.225) - 675.49; 
        irrfBracketInfo = `22,5% (Deduzir ${formatCurrency(675.49)})`;
    } 
    else { 
        irrfDiscount = (irrfBase * 0.275) - 908.73; 
        irrfBracketInfo = `27,5% (Deduzir ${formatCurrency(908.73)})`;
    }
    
    if (irrfDiscount < 0) { irrfDiscount = 0; }

    // 6. Totais
    const totalDiscounts = inssDiscount + irrfDiscount + healthInsurance + otherDiscounts;
    const netSalary = grossSalary - totalDiscounts;

    // Atualizar a interface principal
    document.getElementById('grossSalaryResult').textContent = formatCurrency(grossSalary);
    document.getElementById('overtimeValueResult').textContent = formatCurrency(overtimeValue);
    document.getElementById('dsrResult').textContent = formatCurrency(dsrValue);
    document.getElementById('inssResult').textContent = formatCurrency(inssDiscount > 0 ? inssDiscount : 0);
    document.getElementById('irrfResult').textContent = formatCurrency(irrfDiscount > 0 ? irrfDiscount : 0);
    document.getElementById('totalDiscountsResult').textContent = formatCurrency(totalDiscounts > 0 ? totalDiscounts : 0);
    document.getElementById('netSalaryResult').textContent = formatCurrency(netSalary > 0 ? netSalary : 0);

    // Armazenar dados para o resumo
    summaryData = {
        baseSalary, overtimeHours, healthInsurance,
        overtimeValue, dsrValue, grossSalary, inssDiscount, irrfDiscount,
        totalDiscounts, netSalary, hourlyRate, overtimeHourlyRate,
        inssBracketInfo, irrfBracketInfo, workloadLabel
    };
};

// Função para popular e exibir o modal do relatório
const showReport = () => {
    calculateSalary(); // Garante que os dados estão atualizados

    // Vencimentos
    document.getElementById('reportBaseSalary').textContent = formatCurrency(summaryData.baseSalary);
    document.getElementById('reportOvertimeValue').textContent = formatCurrency(summaryData.overtimeValue);
    document.getElementById('reportDsrValue').textContent = formatCurrency(summaryData.dsrValue);
    
    // Descontos
    document.getElementById('reportInss').textContent = formatCurrency(summaryData.inssDiscount);
    document.getElementById('reportIrrf').textContent = formatCurrency(summaryData.irrfDiscount);
    document.getElementById('reportHealthInsurance').textContent = formatCurrency(summaryData.healthInsurance);
    
    // Adicionar descontos dinâmicos ao relatório
    const reportDiscountsContainer = document.getElementById('reportOtherDiscountsContainer');
    reportDiscountsContainer.innerHTML = ''; // Limpa descontos anteriores
    document.querySelectorAll('.discount-row').forEach(row => {
        const description = row.querySelector('.description-field input').value || 'Outro Desconto';
        const value = parseInput(row.querySelector('.value-field input').value);
        if (value > 0) {
            const reportLine = document.createElement('div');
            reportLine.className = 'report-line';
            reportLine.innerHTML = `
                <span class="label">${description}</span>
                <span class="value desconto">${formatCurrency(value)}</span>
            `;
            reportDiscountsContainer.appendChild(reportLine);
        }
    });


    // Bases
    document.getElementById('reportGrossSalary').textContent = formatCurrency(summaryData.grossSalary);
    document.getElementById('reportTotalDiscounts').textContent = formatCurrency(summaryData.totalDiscounts);

    // Info Adicional
    document.getElementById('reportWorkload').textContent = summaryData.workloadLabel;
    document.getElementById('reportOvertimeHours').textContent = summaryData.overtimeHours;
    document.getElementById('reportHourlyRate').textContent = formatCurrency(summaryData.hourlyRate);
    document.getElementById('reportOvertimeRate').textContent = formatCurrency(summaryData.overtimeHourlyRate);

    // Enquadramento
    document.getElementById('reportInssBracket').textContent = summaryData.inssBracketInfo;
    document.getElementById('reportIrrfBracket').textContent = summaryData.irrfBracketInfo;

    // Total Líquido
    document.getElementById('reportNetSalary').textContent = formatCurrency(summaryData.netSalary);

    // Exibir o modal
    document.getElementById('reportModal').classList.add('visible');
};

// Função para fechar o modal
const closeReport = () => {
    document.getElementById('reportModal').classList.remove('visible');
};

// Função para imprimir o relatório
const printReport = () => {
    window.print();
};

// Função para adicionar uma nova linha de desconto
const addDiscountRow = () => {
    const container = document.getElementById('otherDiscountsContainer');
    const newRow = document.createElement('div');
    newRow.className = 'discount-row';
    newRow.innerHTML = `
        <div class="input-group description-field">
            <label>Descrição do Desconto</label>
            <input type="text" placeholder="Ex: Vale Refeição">
        </div>
        <div class="input-group value-field">
            <label>Valor (R$)</label>
            <input type="text" placeholder="Ex: 100,00">
        </div>
        <button class="remove-btn">&times;</button>
    `;
    container.appendChild(newRow);
};

// Função para limpar todos os campos do formulário
const clearFields = () => {
    // Limpa todos os inputs de texto
    const textInputs = document.querySelectorAll('input[type="text"]');
    textInputs.forEach(input => input.value = '');

    // Reseta o seletor de carga horária para o valor padrão
    document.getElementById('workload').value = '220';

    // Remove todos os descontos dinâmicos que foram adicionados
    document.getElementById('otherDiscountsContainer').innerHTML = '';

    // Recalcula para que a interface de resultados seja zerada
    calculateSalary();
};


// --- EVENT LISTENERS ---
// Adiciona listeners para todos os inputs estáticos
const staticInputs = document.querySelectorAll('input, select');
staticInputs.forEach(input => {
    input.addEventListener('change', calculateSalary);
    if(input.tagName === 'INPUT') {
        input.addEventListener('keyup', calculateSalary);
        // Aplica máscara de formatação
        if (input.id !== 'workingDays' && input.id !== 'sundaysAndHolidays' && input.id !== 'overtimeHours') {
            input.addEventListener('input', () => formatCurrencyInput(input));
        }
    }
});

// Adiciona listener para o container de descontos dinâmicos (event delegation)
document.getElementById('otherDiscountsContainer').addEventListener('keyup', (e) => {
    if (e.target.tagName === 'INPUT') {
        calculateSalary();
    }
});
document.getElementById('otherDiscountsContainer').addEventListener('input', (e) => {
    if (e.target.tagName === 'INPUT' && e.target.parentElement.classList.contains('value-field')) {
        formatCurrencyInput(e.target);
    }
});
document.getElementById('otherDiscountsContainer').addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-btn')) {
        e.target.parentElement.remove();
        calculateSalary();
    }
});


// Listeners dos botões principais
document.getElementById('addDiscountBtn').addEventListener('click', addDiscountRow);
document.getElementById('generateReportBtn').addEventListener('click', showReport);
document.getElementById('clearFieldsBtn').addEventListener('click', clearFields); // Novo listener
document.getElementById('closeModalBtn').addEventListener('click', closeReport);
document.getElementById('printReportBtn').addEventListener('click', printReport);
document.getElementById('reportModal').addEventListener('click', (e) => {
    if (e.target.id === 'reportModal') {
        closeReport();
    }
});

// Cálculo inicial ao carregar a página
calculateSalary();
