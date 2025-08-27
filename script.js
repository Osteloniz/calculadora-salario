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
    // --- 1. COLETA DE DADOS DOS INPUTS ---
    const workloadDivisor = parseInt(document.getElementById('workload').value);
    const workloadLabel = document.getElementById('workload').options[document.getElementById('workload').selectedIndex].text;
    const baseSalary = parseInput(document.getElementById('baseSalary').value);
    
    // Horas Extras
    const overtimeHours = parseInput(document.getElementById('overtimeHours').value);
    const overtimePercentage = parseInput(document.getElementById('overtimePercentage').value);
    
    // Adicional Noturno
    const nightShiftHours = parseInput(document.getElementById('nightShiftHours').value);
    const nightOvertimeHours = parseInput(document.getElementById('nightOvertimeHours').value);
    const nightShiftPercentage = parseInput(document.getElementById('nightShiftPercentage').value);

    // Bonificação
    const trainingValue = parseInput(document.getElementById('trainingValue').value);
    const trainingDuration = parseInput(document.getElementById('trainingDuration').value);
    const trainingHoursGiven = parseInput(document.getElementById('trainingHoursGiven').value);

    // Descontos
    const healthInsurance = parseInput(document.getElementById('healthInsurance').value);
    let otherDiscounts = 0;
    document.querySelectorAll('.discount-row .value-field input').forEach(input => {
        otherDiscounts += parseInput(input.value);
    });
    
    // DSR
    const workingDays = parseInput(document.getElementById('workingDays').value);
    const sundaysAndHolidays = parseInput(document.getElementById('sundaysAndHolidays').value);

    // --- 2. CÁLCULO DOS VENCIMENTOS ---
    const hourlyRate = baseSalary > 0 ? baseSalary / workloadDivisor : 0;

    // Horas Extras Diurnas
    const overtimeRate = hourlyRate * (1 + overtimePercentage / 100);
    const overtimeValue = overtimeHours * overtimeRate;

    // Adicional Noturno (sobre horas normais noturnas)
    const nightShiftValue = nightShiftHours * hourlyRate * (nightShiftPercentage / 100);
    
    // Horas Extras Noturnas
    const nightHourRate = hourlyRate * (1 + nightShiftPercentage / 100);
    const nightOvertimeRate = nightHourRate * (1 + overtimePercentage / 100);
    const nightOvertimeValue = nightOvertimeHours * nightOvertimeRate;

    // Bonificação (antiga comissão)
    let bonusValue = 0;
    if (trainingValue > 0 && trainingDuration > 0 && trainingHoursGiven > 0) {
        const trainingHourlyRate = trainingValue / trainingDuration;
        bonusValue = trainingHourlyRate * 0.10 * trainingHoursGiven;
    }

    // DSR (sobre todas as verbas variáveis, EXCETO bonificação)
    const dsrBase = overtimeValue + nightShiftValue + nightOvertimeValue;
    const dsrValue = workingDays > 0 ? (dsrBase / workingDays) * sundaysAndHolidays : 0;

    // Salário Bruto Total
    const grossSalary = baseSalary + overtimeValue + nightShiftValue + nightOvertimeValue + bonusValue + dsrValue;

    // --- 3. CÁLCULO DOS DESCONTOS ---
    let inssDiscount = 0;
    let inssBracketInfo = "";
    if (grossSalary <= 1518.00) { 
        inssDiscount = grossSalary * 0.075; inssBracketInfo = "Faixa 1: 7,5%";
    } else if (grossSalary <= 2793.88) { 
        inssDiscount = (grossSalary * 0.09) - 22.77; inssBracketInfo = "Faixa 2: 9%";
    } else if (grossSalary <= 4190.83) { 
        inssDiscount = (grossSalary * 0.12) - 106.59; inssBracketInfo = "Faixa 3: 12%";
    } else if (grossSalary <= 8157.41) { 
        inssDiscount = (grossSalary * 0.14) - 190.40; inssBracketInfo = "Faixa 4: 14%";
    } else { 
        inssDiscount = 951.62; inssBracketInfo = "Teto de Contribuição";
    }

    const irrfBase = grossSalary - inssDiscount;
    let irrfDiscount = 0;
    let irrfBracketInfo = "";
    if (irrfBase <= 2428.80) { 
        irrfDiscount = 0; irrfBracketInfo = "Isento";
    } else if (irrfBase <= 2826.65) { 
        irrfDiscount = (irrfBase * 0.075) - 182.16; irrfBracketInfo = `7,5% (Deduzir ${formatCurrency(182.16)})`;
    } else if (irrfBase <= 3751.05) { 
        irrfDiscount = (irrfBase * 0.15) - 394.16; irrfBracketInfo = `15% (Deduzir ${formatCurrency(394.16)})`;
    } else if (irrfBase <= 4664.68) { 
        irrfDiscount = (irrfBase * 0.225) - 675.49; irrfBracketInfo = `22,5% (Deduzir ${formatCurrency(675.49)})`;
    } else { 
        irrfDiscount = (irrfBase * 0.275) - 908.73; irrfBracketInfo = `27,5% (Deduzir ${formatCurrency(908.73)})`;
    }
    if (irrfDiscount < 0) { irrfDiscount = 0; }

    // --- 4. TOTAIS E ATUALIZAÇÃO DA UI ---
    const totalEarnings = grossSalary;
    const totalDiscounts = inssDiscount + irrfDiscount + healthInsurance + otherDiscounts;
    const netSalary = totalEarnings - totalDiscounts;

    document.getElementById('grossSalaryResult').textContent = formatCurrency(baseSalary);
    document.getElementById('totalEarningsResult').textContent = formatCurrency(totalEarnings);
    document.getElementById('totalDiscountsResult').textContent = formatCurrency(totalDiscounts);
    document.getElementById('netSalaryResult').textContent = formatCurrency(netSalary);

    // Armazenar dados para o resumo
    summaryData = {
        baseSalary, healthInsurance, overtimeValue, nightShiftValue, nightOvertimeValue, 
        bonusValue, dsrValue, totalEarnings, inssDiscount, irrfDiscount, 
        totalDiscounts, netSalary, hourlyRate, inssBracketInfo, irrfBracketInfo, workloadLabel,
        overtimeHours, nightOvertimeHours, overtimeRate, nightOvertimeRate
    };
};

// Função para popular e exibir o modal do relatório
const showReport = () => {
    calculateSalary(); 

    const earningsContainer = document.getElementById('reportEarningsContainer');
    const discountsContainer = document.getElementById('reportDiscountsContainer');
    earningsContainer.innerHTML = '';
    discountsContainer.innerHTML = '';

    const appendReportLine = (container, label, value, isDiscount = false) => {
        // Apenas adiciona a linha se o valor for maior que zero
        if (value > 0) {
            const line = document.createElement('div');
            line.className = 'report-line';
            line.innerHTML = `
                <span class="label">${label}</span>
                <span class="value ${isDiscount ? 'desconto' : ''}">${formatCurrency(value)}</span>
            `;
            container.appendChild(line);
        }
    };

    // Vencimentos
    appendReportLine(earningsContainer, 'Salário Base', summaryData.baseSalary);
    appendReportLine(earningsContainer, 'Horas Extras Diurnas', summaryData.overtimeValue);
    appendReportLine(earningsContainer, 'Adicional Noturno', summaryData.nightShiftValue);
    appendReportLine(earningsContainer, 'Horas Extras Noturnas', summaryData.nightOvertimeValue);
    appendReportLine(earningsContainer, 'Bonificação', summaryData.bonusValue);
    appendReportLine(earningsContainer, 'DSR s/ Verbas Variáveis', summaryData.dsrValue);

    // Descontos
    appendReportLine(discountsContainer, 'INSS', summaryData.inssDiscount, true);
    appendReportLine(discountsContainer, 'IRRF', summaryData.irrfDiscount, true);
    appendReportLine(discountsContainer, 'Convênio Médico', summaryData.healthInsurance, true);

    document.querySelectorAll('.discount-row').forEach(row => {
        const description = row.querySelector('.description-field input').value || 'Outro Desconto';
        const value = parseInput(row.querySelector('.value-field input').value);
        if (value > 0) {
            appendReportLine(discountsContainer, description, value, true);
        }
    });

    // Bases
    document.getElementById('reportGrossSalary').textContent = formatCurrency(summaryData.totalEarnings);
    document.getElementById('reportTotalDiscounts').textContent = formatCurrency(summaryData.totalDiscounts);

    // Info Adicional
    document.getElementById('reportWorkload').textContent = summaryData.workloadLabel;
    document.getElementById('reportOvertimeHours').textContent = summaryData.overtimeHours > 0 ? summaryData.overtimeHours + 'h' : '---';
    document.getElementById('reportNightOvertimeHours').textContent = summaryData.nightOvertimeHours > 0 ? summaryData.nightOvertimeHours + 'h' : '---';
    document.getElementById('reportHourlyRate').textContent = formatCurrency(summaryData.hourlyRate);
    document.getElementById('reportOvertimeRate').textContent = formatCurrency(summaryData.overtimeRate);
    document.getElementById('reportNightOvertimeRate').textContent = formatCurrency(summaryData.nightOvertimeRate);

    // Enquadramento
    document.getElementById('reportInssBracket').textContent = summaryData.inssBracketInfo;
    document.getElementById('reportIrrfBracket').textContent = summaryData.irrfBracketInfo;

    // Total Líquido
    document.getElementById('reportNetSalary').textContent = formatCurrency(summaryData.netSalary);

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
            <input type="text" placeholder="Ex: 100,00" inputmode="decimal">
        </div>
        <button class="remove-btn">&times;</button>
    `;
    container.appendChild(newRow);
};

// Função para limpar todos os campos do formulário
const clearFields = () => {
    const textInputs = document.querySelectorAll('input[type="text"]');
    textInputs.forEach(input => input.value = '');
    document.getElementById('workload').value = '220';
    document.getElementById('overtimePercentage').value = '75';
    document.getElementById('nightShiftPercentage').value = '20';
    document.getElementById('otherDiscountsContainer').innerHTML = '';
    calculateSalary();
};


// --- EVENT LISTENERS ---
const allInputs = document.querySelectorAll('input, select');
allInputs.forEach(input => {
    input.addEventListener('change', calculateSalary);
    if(input.tagName === 'INPUT') {
        input.addEventListener('keyup', calculateSalary);
        if (input.type === 'text' && (input.id.toLowerCase().includes('value') || input.id.toLowerCase().includes('salary') || input.id.toLowerCase().includes('insurance'))) {
             input.addEventListener('input', () => formatCurrencyInput(input));
        }
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

document.getElementById('addDiscountBtn').addEventListener('click', addDiscountRow);
document.getElementById('generateReportBtn').addEventListener('click', showReport);
document.getElementById('clearFieldsBtn').addEventListener('click', clearFields);
document.getElementById('closeModalBtn').addEventListener('click', closeReport);
document.getElementById('printReportBtn').addEventListener('click', printReport);
document.getElementById('reportModal').addEventListener('click', (e) => {
    if (e.target.id === 'reportModal') {
        closeReport();
    }
});

// Cálculo inicial ao carregar a página
calculateSalary();
