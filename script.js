// Objeto para armazenar os dados do cálculo para o relatório
let summaryData = {};
let lastVariableAverage = 0; // Variável para armazenar a última média calculada

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

// Função para calcular INSS (pode ser reutilizada)
const calculateINSS = (base) => {
    let discount = 0;
    let bracketInfo = "";
    if (base <= 1518.00) { 
        discount = base * 0.075; bracketInfo = "Faixa 1: 7,5%";
    } else if (base <= 2793.88) { 
        discount = (base * 0.09) - 22.77; bracketInfo = "Faixa 2: 9%";
    } else if (base <= 4190.83) { 
        discount = (base * 0.12) - 106.59; bracketInfo = "Faixa 3: 12%";
    } else if (base <= 8157.41) { 
        discount = (base * 0.14) - 190.40; bracketInfo = "Faixa 4: 14%";
    } else { 
        discount = 951.62; bracketInfo = "Teto de Contribuição";
    }
    return { discount, bracketInfo };
};

// Função para calcular IRRF (pode ser reutilizada)
const calculateIRRF = (base) => {
    let discount = 0;
    let bracketInfo = "";
    if (base <= 2428.80) { 
        discount = 0; bracketInfo = "Isento";
    } else if (base <= 2826.65) { 
        discount = (base * 0.075) - 182.16; bracketInfo = `7,5% (Deduzir ${formatCurrency(182.16)})`;
    } else if (base <= 3751.05) { 
        discount = (base * 0.15) - 394.16; bracketInfo = `15% (Deduzir ${formatCurrency(394.16)})`;
    } else if (base <= 4664.68) { 
        discount = (base * 0.225) - 675.49; bracketInfo = `22,5% (Deduzir ${formatCurrency(675.49)})`;
    } else { 
        discount = (base * 0.275) - 908.73; bracketInfo = `27,5% (Deduzir ${formatCurrency(908.73)})`;
    }
    return { discount: discount < 0 ? 0 : discount, bracketInfo };
};


// Função principal para calcular o salário MENSAL
const calculateMonthlySalary = () => {
    // Coleta de dados
    const workloadDivisor = parseInt(document.getElementById('workload').value);
    const baseSalary = parseInput(document.getElementById('baseSalary').value);
    const overtimeHours = parseInput(document.getElementById('overtimeHours').value);
    const overtimePercentage = parseInput(document.getElementById('overtimePercentage').value);
    const nightShiftHours = parseInput(document.getElementById('nightShiftHours').value);
    const nightOvertimeHours = parseInput(document.getElementById('nightOvertimeHours').value);
    const nightShiftPercentage = parseInput(document.getElementById('nightShiftPercentage').value);
    const trainingValue = parseInput(document.getElementById('trainingValue').value);
    const trainingDuration = parseInput(document.getElementById('trainingDuration').value);
    const trainingHoursGiven = parseInput(document.getElementById('trainingHoursGiven').value);
    const healthInsurance = parseInput(document.getElementById('healthInsurance').value);
    let otherDiscounts = 0;
    document.querySelectorAll('.discount-row .value-field input').forEach(input => {
        otherDiscounts += parseInput(input.value);
    });
    const workingDays = parseInput(document.getElementById('workingDays').value);
    const sundaysAndHolidays = parseInput(document.getElementById('sundaysAndHolidays').value);

    // Cálculos de Vencimentos
    const hourlyRate = baseSalary > 0 ? baseSalary / workloadDivisor : 0;
    const overtimeRate = hourlyRate * (1 + overtimePercentage / 100);
    const overtimeValue = overtimeHours * overtimeRate;
    const nightShiftValue = nightShiftHours * hourlyRate * (nightShiftPercentage / 100);
    const nightHourRate = hourlyRate * (1 + nightShiftPercentage / 100);
    const nightOvertimeRate = nightHourRate * (1 + overtimePercentage / 100);
    const nightOvertimeValue = nightOvertimeHours * nightOvertimeRate;
    let commissionValue = 0;
    if (trainingValue > 0 && trainingDuration > 0 && trainingHoursGiven > 0) {
        const trainingHourlyRate = trainingValue / trainingDuration;
        commissionValue = trainingHourlyRate * 0.10 * trainingHoursGiven;
    }
    const dsrBase = overtimeValue + nightShiftValue + nightOvertimeValue + commissionValue; // Comissão volta a incidir no DSR
    const dsrValue = workingDays > 0 ? (dsrBase / workingDays) * sundaysAndHolidays : 0;
    const grossSalary = baseSalary + overtimeValue + nightShiftValue + nightOvertimeValue + commissionValue + dsrValue;

    // Cálculos de Descontos
    const { discount: inssDiscount, bracketInfo: inssBracketInfo } = calculateINSS(grossSalary);
    const irrfBase = grossSalary - inssDiscount;
    const { discount: irrfDiscount, bracketInfo: irrfBracketInfo } = calculateIRRF(irrfBase);
    
    // Totais
    const totalEarnings = grossSalary;
    const totalDiscounts = inssDiscount + irrfDiscount + healthInsurance + otherDiscounts;
    const netSalary = totalEarnings - totalDiscounts;

    // Atualização da UI
    document.getElementById('totalEarningsResult').textContent = formatCurrency(totalEarnings);
    document.getElementById('inssResult').textContent = formatCurrency(inssDiscount);
    document.getElementById('irrfResult').textContent = formatCurrency(irrfDiscount);
    document.getElementById('totalDiscountsResult').textContent = formatCurrency(totalDiscounts);
    document.getElementById('netSalaryResult').textContent = formatCurrency(netSalary);

    // Armazena a média de variáveis para a aba de Férias
    lastVariableAverage = dsrBase; 

    // Armazenar dados para o resumo
    summaryData = {
        baseSalary, healthInsurance, overtimeValue, nightShiftValue, nightOvertimeValue, 
        commissionValue, dsrValue, totalEarnings, inssDiscount, irrfDiscount, 
        totalDiscounts, netSalary, hourlyRate, inssBracketInfo, irrfBracketInfo, 
        workloadLabel: document.getElementById('workload').options[document.getElementById('workload').selectedIndex].text,
        overtimeHours, nightOvertimeHours, overtimeRate, nightOvertimeRate
    };
};

// Função para calcular FÉRIAS
const calculateVacation = () => {
    const baseSalary = parseInput(document.getElementById('baseSalary').value);
    const vacationDays = parseInt(document.getElementById('vacationDays').value);
    const variableAverage = parseInput(document.getElementById('variableAverage').value);

    // Cálculo do valor das férias
    const vacationPay = (baseSalary / 30) * vacationDays;
    const vacationBonus = vacationPay / 3;
    const variablePayOnVacation = (variableAverage / 30) * vacationDays;
    const grossVacationPay = vacationPay + vacationBonus + variablePayOnVacation;
    const fgtsOnVacation = grossVacationPay * 0.08;
    
    const { discount: inssOnVacation } = calculateINSS(grossVacationPay);
    const { discount: irrfOnVacation } = calculateIRRF(grossVacationPay - inssOnVacation);
    const netVacationPay = grossVacationPay - inssOnVacation - irrfOnVacation;

    // Cálculo do salário no mês de retorno
    const daysWorked = 30 - vacationDays;
    const postVacationSalary = (baseSalary / 30) * daysWorked;
    const { discount: inssOnReturn } = calculateINSS(postVacationSalary);
    const { discount: irrfOnReturn } = calculateIRRF(postVacationSalary - inssOnReturn);
    const netPostVacationSalary = postVacationSalary - inssOnReturn - irrfOnReturn;

    // Exibir resultados
    const vacationDetails = document.getElementById('vacationPaymentDetails');
    vacationDetails.innerHTML = `
        <div class="report-line"><span class="label">Salário Férias</span><span class="value">${formatCurrency(vacationPay)}</span></div>
        <div class="report-line"><span class="label">Adicional 1/3</span><span class="value">${formatCurrency(vacationBonus)}</span></div>
        <div class="report-line"><span class="label">Média Variáveis</span><span class="value">${formatCurrency(variablePayOnVacation)}</span></div>
        <div class="report-line"><span class="label">INSS s/ Férias</span><span class="value desconto">${formatCurrency(inssOnVacation)}</span></div>
        <div class="report-line"><span class="label">IRRF s/ Férias</span><span class="value desconto">${formatCurrency(irrfOnVacation)}</span></div>
        <div class="report-line total-line"><span class="label">Líquido a Receber</span><span class="value">${formatCurrency(netVacationPay)}</span></div>
    `;
    const postVacationDetails = document.getElementById('postVacationPaymentDetails');
    postVacationDetails.innerHTML = `
        <div class="report-line"><span class="label">Salário ${daysWorked} dias</span><span class="value">${formatCurrency(postVacationSalary)}</span></div>
        <div class="report-line"><span class="label">INSS s/ Salário</span><span class="value desconto">${formatCurrency(inssOnReturn)}</span></div>
        <div class="report-line"><span class="label">IRRF s/ Salário</span><span class="value desconto">${formatCurrency(irrfOnReturn)}</span></div>
        <div class="report-line total-line"><span class="label">Líquido a Receber</span><span class="value">${formatCurrency(netPostVacationSalary)}</span></div>
    `;
};

// Função para calcular 13º SALÁRIO
const calculate13th = () => {
    const baseSalary = parseInput(document.getElementById('baseSalary').value);
    const monthsWorked = parseInt(document.getElementById('monthsWorked').value) || 0;

    const gross13th = (baseSalary / 12) * monthsWorked;
    const firstInstallment = gross13th / 2;

    const { discount: inssOn13th } = calculateINSS(gross13th);
    const { discount: irrfOn13th } = calculateIRRF(gross13th - inssOn13th);
    const secondInstallment = (gross13th / 2) - inssOn13th - irrfOn13th;
    const totalNet13th = firstInstallment + secondInstallment;

    const firstInstallmentDetails = document.getElementById('thirteenthFirstInstallment');
    firstInstallmentDetails.innerHTML = `
        <div class="report-line"><span class="label">Valor Bruto</span><span class="value">${formatCurrency(firstInstallment)}</span></div>
        <div class="report-line"><span class="label">Descontos</span><span class="value">R$ 0,00</span></div>
        <div class="report-line total-line"><span class="label">Líquido a Receber</span><span class="value">${formatCurrency(firstInstallment)}</span></div>
    `;
    const secondInstallmentDetails = document.getElementById('thirteenthSecondInstallment');
    secondInstallmentDetails.innerHTML = `
        <div class="report-line"><span class="label">Valor Bruto</span><span class="value">${formatCurrency(gross13th / 2)}</span></div>
        <div class="report-line"><span class="label">INSS (Total)</span><span class="value desconto">${formatCurrency(inssOn13th)}</span></div>
        <div class="report-line"><span class="label">IRRF (Total)</span><span class="value desconto">${formatCurrency(irrfOn13th)}</span></div>
        <div class="report-line total-line"><span class="label">Líquido a Receber</span><span class="value">${formatCurrency(secondInstallment)}</span></div>
    `;
    document.getElementById('thirteenthTotalNet').textContent = formatCurrency(totalNet13th);
};


// Função para popular e exibir o modal do relatório MENSAL
const showMonthlyReport = () => {
    calculateMonthlySalary(); 

    const modal = document.getElementById('reportModal');
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Resumo do Cálculo Mensal</h2>
                <button class="modal-close-btn">&times;</button>
            </div>
            <div class="modal-body">
                <div class="report-grid">
                    <div class="report-section">
                        <h3>Vencimentos</h3>
                        <div id="reportEarningsContainer"></div>
                    </div>
                    <div class="report-section">
                        <h3>Descontos</h3>
                        <div id="reportDiscountsContainer"></div>
                    </div>
                </div>
                 <div class="report-grid">
                    <div class="report-section">
                        <h3>Bases de Cálculo</h3>
                        <div class="report-line">
                            <span class="label">Total Vencimentos</span>
                            <span class="value vencimento">${formatCurrency(summaryData.totalEarnings)}</span>
                        </div>
                        <div class="report-line">
                            <span class="label">FGTS do Mês (Depósito)</span>
                            <span class="value">${formatCurrency(summaryData.totalEarnings * 0.08)}</span>
                        </div>
                        <div class="report-line">
                            <span class="label">Total Descontos</span>
                            <span class="value desconto">${formatCurrency(summaryData.totalDiscounts)}</span>
                        </div>
                    </div>
                    <div class="report-section">
                        <h3>Informações Adicionais</h3>
                        <div class="report-line">
                            <span class="label">Carga Horária</span>
                            <span class="value">${summaryData.workloadLabel}</span>
                        </div>
                        <div class="report-line">
                            <span class="label">Qtd. HE Diurnas</span>
                            <span class="value">${summaryData.overtimeHours > 0 ? summaryData.overtimeHours + 'h' : '---'}</span>
                        </div>
                        <div class="report-line">
                            <span class="label">Qtd. HE Noturnas</span>
                            <span class="value">${summaryData.nightOvertimeHours > 0 ? summaryData.nightOvertimeHours + 'h' : '---'}</span>
                        </div>
                         <div class="report-line">
                            <span class="label">Valor Hora Normal</span>
                            <span class="value">${formatCurrency(summaryData.hourlyRate)}</span>
                        </div>
                         <div class="report-line">
                            <span class="label">Valor HE Diurna</span>
                            <span class="value">${formatCurrency(summaryData.overtimeRate)}</span>
                        </div>
                         <div class="report-line">
                            <span class="label">Valor HE Noturna</span>
                            <span class="value">${formatCurrency(summaryData.nightOvertimeRate)}</span>
                        </div>
                    </div>
                </div>
                <div class="report-section" style="grid-column: 1 / -1;">
                    <h3>Enquadramento de Impostos</h3>
                    <div class="report-line">
                        <span class="label">Faixa INSS</span>
                        <span class="value">${summaryData.inssBracketInfo}</span>
                    </div>
                    <div class="report-line">
                        <span class="label">Faixa IRRF</span>
                        <span class="value">${summaryData.irrfBracketInfo}</span>
                    </div>
                </div>
                <div class="report-footer">
                    <div class="total-line">
                        <span>Valor Líquido a Receber: </span>
                        <span>${formatCurrency(summaryData.netSalary)}</span>
                    </div>
                    <div class="actions">
                        <button class="print-btn">Imprimir / Salvar como PDF</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    const earningsContainer = modal.querySelector('#reportEarningsContainer');
    const discountsContainer = modal.querySelector('#reportDiscountsContainer');
    
    const appendReportLine = (container, label, value, isDiscount = false) => {
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

    appendReportLine(earningsContainer, 'Salário Base', summaryData.baseSalary);
    appendReportLine(earningsContainer, 'Horas Extras Diurnas', summaryData.overtimeValue);
    appendReportLine(earningsContainer, 'Adicional Noturno', summaryData.nightShiftValue);
    appendReportLine(earningsContainer, 'Horas Extras Noturnas', summaryData.nightOvertimeValue);
    appendReportLine(earningsContainer, 'Comissão', summaryData.commissionValue);
    appendReportLine(earningsContainer, 'DSR s/ Verbas Variáveis', summaryData.dsrValue);

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

    modal.classList.add('visible');
};

// Função para exibir o modal de FÉRIAS
const showVacationReport = () => {
    const modal = document.getElementById('vacationReportModal');
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Resumo da Simulação de Férias</h2>
                <button class="modal-close-btn">&times;</button>
            </div>
            <div class="modal-body">
                <div class="result-grid-vacation">
                    <div class="result-card">
                        <h3>Valor a Receber pelas Férias</h3>
                        <div id="vacationPaymentDetails_report"></div>
                    </div>
                    <div class="result-card">
                        <h3>Salário no Mês de Retorno</h3>
                        <div id="postVacationPaymentDetails_report"></div>
                    </div>
                </div>
            </div>
             <div class="report-footer">
                <div class="actions">
                    <button class="print-btn">Imprimir / Salvar como PDF</button>
                </div>
            </div>
        </div>
    `;
    // Popula o conteúdo do relatório
    modal.querySelector('#vacationPaymentDetails_report').innerHTML = document.getElementById('vacationPaymentDetails').innerHTML;
    modal.querySelector('#postVacationPaymentDetails_report').innerHTML = document.getElementById('postVacationPaymentDetails').innerHTML;
    modal.classList.add('visible');
};

// Função para exibir o modal do 13º
const show13thReport = () => {
    const modal = document.getElementById('thirteenthReportModal');
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Resumo da Simulação do 13º Salário</h2>
                <button class="modal-close-btn">&times;</button>
            </div>
            <div class="modal-body">
                 <div class="result-grid-vacation">
                    <div class="result-card">
                        <h3>1ª Parcela (Adiantamento)</h3>
                        <div id="thirteenthFirstInstallment_report"></div>
                    </div>
                    <div class="result-card">
                        <h3>2ª Parcela (Pagamento Final)</h3>
                        <div id="thirteenthSecondInstallment_report"></div>
                    </div>
                </div>
                <div class="net-salary-highlight">
                    <p class="label">TOTAL LÍQUIDO 13º SALÁRIO</p>
                    <p class="value">${document.getElementById('thirteenthTotalNet').textContent}</p>
                </div>
            </div>
             <div class="report-footer">
                <div class="actions">
                    <button class="print-btn">Imprimir / Salvar como PDF</button>
                </div>
            </div>
        </div>
    `;
    // Popula o conteúdo do relatório
    modal.querySelector('#thirteenthFirstInstallment_report').innerHTML = document.getElementById('thirteenthFirstInstallment').innerHTML;
    modal.querySelector('#thirteenthSecondInstallment_report').innerHTML = document.getElementById('thirteenthSecondInstallment').innerHTML;
    modal.classList.add('visible');
};


// Função para fechar o modal
const closeReport = (modal) => {
    modal.classList.remove('visible');
};

// Função para imprimir o relatório
const printReport = (modal) => {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('printable'));
    modal.classList.add('printable');
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
    // Limpa o cache do navegador
    localStorage.removeItem('salaryCalculatorData');

    const textInputs = document.querySelectorAll('input[type="text"]');
    textInputs.forEach(input => input.value = '');
    document.getElementById('workload').value = '220';
    document.getElementById('overtimePercentage').value = '75';
    document.getElementById('nightShiftPercentage').value = '20';
    document.getElementById('monthsWorked').value = '12';
    document.getElementById('otherDiscountsContainer').innerHTML = '';
    calculateMonthlySalary();
    calculateVacation();
    calculate13th();
};

// Função para salvar os dados no cache
const saveInputsToCache = () => {
    const dynamicDiscounts = [];
    document.querySelectorAll('.discount-row').forEach(row => {
        dynamicDiscounts.push({
            description: row.querySelector('.description-field input').value,
            value: row.querySelector('.value-field input').value
        });
    });

    const data = {
        workload: document.getElementById('workload').value,
        baseSalary: document.getElementById('baseSalary').value,
        overtimeHours: document.getElementById('overtimeHours').value,
        overtimePercentage: document.getElementById('overtimePercentage').value,
        nightShiftHours: document.getElementById('nightShiftHours').value,
        nightOvertimeHours: document.getElementById('nightOvertimeHours').value,
        nightShiftPercentage: document.getElementById('nightShiftPercentage').value,
        trainingValue: document.getElementById('trainingValue').value,
        trainingDuration: document.getElementById('trainingDuration').value,
        trainingHoursGiven: document.getElementById('trainingHoursGiven').value,
        healthInsurance: document.getElementById('healthInsurance').value,
        workingDays: document.getElementById('workingDays').value,
        sundaysAndHolidays: document.getElementById('sundaysAndHolidays').value,
        vacationDays: document.getElementById('vacationDays').value,
        monthsWorked: document.getElementById('monthsWorked').value,
        dynamicDiscounts: dynamicDiscounts
    };
    localStorage.setItem('salaryCalculatorData', JSON.stringify(data));
};

// Função para carregar os dados do cache
const loadInputsFromCache = () => {
    const data = JSON.parse(localStorage.getItem('salaryCalculatorData'));
    if (data) {
        document.getElementById('workload').value = data.workload || '220';
        document.getElementById('baseSalary').value = data.baseSalary || '';
        document.getElementById('overtimeHours').value = data.overtimeHours || '';
        document.getElementById('overtimePercentage').value = data.overtimePercentage || '75';
        document.getElementById('nightShiftHours').value = data.nightShiftHours || '';
        document.getElementById('nightOvertimeHours').value = data.nightOvertimeHours || '';
        document.getElementById('nightShiftPercentage').value = data.nightShiftPercentage || '20';
        document.getElementById('trainingValue').value = data.trainingValue || '';
        document.getElementById('trainingDuration').value = data.trainingDuration || '';
        document.getElementById('trainingHoursGiven').value = data.trainingHoursGiven || '';
        document.getElementById('healthInsurance').value = data.healthInsurance || '';
        document.getElementById('workingDays').value = data.workingDays || '';
        document.getElementById('sundaysAndHolidays').value = data.sundaysAndHolidays || '';
        document.getElementById('vacationDays').value = data.vacationDays || '30';
        document.getElementById('monthsWorked').value = data.monthsWorked || '12';

        if(data.dynamicDiscounts) {
            const container = document.getElementById('otherDiscountsContainer');
            container.innerHTML = '';
            data.dynamicDiscounts.forEach(d => {
                addDiscountRow();
                const newRow = container.lastChild;
                newRow.querySelector('.description-field input').value = d.description;
                newRow.querySelector('.value-field input').value = d.value;
            });
        }
    }
};

// Função para exportar os dados para CSV
const exportToCSV = (type) => {
    // Garante que os dados estão atualizados
    calculateMonthlySalary();
    calculateVacation();
    calculate13th();

    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // UTF-8 BOM
    csvContent += "Categoria,Descrição,Valor\r\n";

    if (type === 'monthly') {
        csvContent += "Salário Mensal,Salário Base," + `"${formatCurrency(summaryData.baseSalary)}"` + "\r\n";
        if(summaryData.overtimeValue > 0) csvContent += "Salário Mensal,Horas Extras Diurnas," + `"${formatCurrency(summaryData.overtimeValue)}"` + "\r\n";
        if(summaryData.nightShiftValue > 0) csvContent += "Salário Mensal,Adicional Noturno," + `"${formatCurrency(summaryData.nightShiftValue)}"` + "\r\n";
        if(summaryData.nightOvertimeValue > 0) csvContent += "Salário Mensal,Horas Extras Noturnas," + `"${formatCurrency(summaryData.nightOvertimeValue)}"` + "\r\n";
        if(summaryData.commissionValue > 0) csvContent += "Salário Mensal,Comissão," + `"${formatCurrency(summaryData.commissionValue)}"` + "\r\n";
        if(summaryData.dsrValue > 0) csvContent += "Salário Mensal,DSR s/ Verbas Variáveis," + `"${formatCurrency(summaryData.dsrValue)}"` + "\r\n";
        csvContent += "Salário Mensal,TOTAL VENCIMENTOS," + `"${formatCurrency(summaryData.totalEarnings)}"` + "\r\n";
        csvContent += "Salário Mensal,INSS," + `"-${formatCurrency(summaryData.inssDiscount)}"` + "\r\n";
        csvContent += "Salário Mensal,IRRF," + `"-${formatCurrency(summaryData.irrfDiscount)}"` + "\r\n";
        if(summaryData.healthInsurance > 0) csvContent += "Salário Mensal,Convênio Médico," + `"-${formatCurrency(summaryData.healthInsurance)}"` + "\r\n";
        document.querySelectorAll('.discount-row').forEach(row => {
            const description = row.querySelector('.description-field input').value || 'Outro Desconto';
            const value = parseInput(row.querySelector('.value-field input').value);
            if (value > 0) {
                csvContent += `Salário Mensal,${description},"-${formatCurrency(value)}"\r\n`;
            }
        });
        csvContent += "Salário Mensal,TOTAL DESCONTOS," + `"-${formatCurrency(summaryData.totalDiscounts)}"` + "\r\n";
        csvContent += "Salário Mensal,LÍQUIDO A RECEBER," + `"${formatCurrency(summaryData.netSalary)}"` + "\r\n";
    } else if (type === 'vacation') {
        const vacationPay = parseInput(document.querySelector('#vacationPaymentDetails .report-line:nth-child(1) .value').textContent);
        const vacationBonus = parseInput(document.querySelector('#vacationPaymentDetails .report-line:nth-child(2) .value').textContent);
        const netVacationPay = parseInput(document.querySelector('#vacationPaymentDetails .total-line .value').textContent);
        csvContent += "Férias,Salário Férias," + `"${formatCurrency(vacationPay)}"` + "\r\n";
        csvContent += "Férias,Adicional 1/3," + `"${formatCurrency(vacationBonus)}"` + "\r\n";
        csvContent += "Férias,LÍQUIDO A RECEBER (FÉRIAS)," + `"${formatCurrency(netVacationPay)}"` + "\r\n";
    } else if (type === 'thirteenth') {
        const firstInstallment = parseInput(document.querySelector('#thirteenthFirstInstallment .total-line .value').textContent);
        const secondInstallment = parseInput(document.querySelector('#thirteenthSecondInstallment .total-line .value').textContent);
        const totalNet13th = parseInput(document.getElementById('thirteenthTotalNet').textContent);
        csvContent += "13º Salário,1ª Parcela (Líquido)," + `"${formatCurrency(firstInstallment)}"` + "\r\n";
        csvContent += "13º Salário,2ª Parcela (Líquido)," + `"${formatCurrency(secondInstallment)}"` + "\r\n";
        csvContent += "13º Salário,TOTAL LÍQUIDO 13º," + `"${formatCurrency(totalNet13th)}"` + "\r\n";
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `resumo_${type}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};


// --- EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', () => {
    loadInputsFromCache(); // Carrega os dados salvos ao iniciar

    const allInputs = document.querySelectorAll('input, select');
    allInputs.forEach(input => {
        const recalculateAll = () => {
            calculateMonthlySalary();
            calculateVacation();
            calculate13th();
            saveInputsToCache(); // Salva os dados a cada alteração
        };
        input.addEventListener('change', recalculateAll);
        if(input.tagName === 'INPUT') {
            input.addEventListener('keyup', recalculateAll);
            if (input.type === 'text' && (input.id.toLowerCase().includes('value') || input.id.toLowerCase().includes('salary') || input.id.toLowerCase().includes('insurance') || input.id.toLowerCase().includes('average'))) {
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
            calculateMonthlySalary();
        }
    });

    // Navegação por Abas
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const globalActionButtons = document.getElementById('clearFieldsBtn').parentElement;
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const tabId = btn.dataset.tab;
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === tabId) {
                    content.classList.add('active');
                }
            });
            globalActionButtons.style.display = (tabId === 'monthly') ? 'flex' : 'none';
        });
    });

    document.getElementById('addDiscountBtn').addEventListener('click', addDiscountRow);
    document.getElementById('generateReportBtn').addEventListener('click', showMonthlyReport);
    document.getElementById('generateVacationReportBtn').addEventListener('click', showVacationReport);
    document.getElementById('generate13thReportBtn').addEventListener('click', show13thReport);
    document.getElementById('clearFieldsBtn').addEventListener('click', clearFields);
    document.getElementById('exportMonthlyBtn').addEventListener('click', () => exportToCSV('monthly'));
    document.getElementById('exportVacationBtn').addEventListener('click', () => exportToCSV('vacation'));
    document.getElementById('export13thBtn').addEventListener('click', () => exportToCSV('thirteenth'));
    
    // Listeners para fechar e imprimir modais (Event Delegation no Body)
    document.body.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal-overlay.visible');
        if (!modal) return;

        if (e.target.classList.contains('modal-close-btn')) {
            closeReport(modal);
        }
        if (e.target.classList.contains('print-btn')) {
            printReport(modal);
        }
        if (e.target === modal) {
            closeReport(modal);
        }
    });

    // Cálculos iniciais ao carregar a página
    calculateMonthlySalary();
    calculateVacation();
    calculate13th();
});
// --- EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', () => {
    // ... (todo o seu código JS existente dentro deste bloco) ...

    // Listener para o formulário de contato
    document.getElementById('contactForm').addEventListener('submit', function(e) {
        e.preventDefault(); // Impede o envio padrão do formulário

        // IMPORTANTE: Substitua 'seu-email@example.com' pelo seu endereço de e-mail.
        const recipientEmail = 'capivara.maislinda@gmail.com'; 
        
        const name = document.getElementById('contactName').value;
        const subject = document.getElementById('contactSubject').value;
        const message = document.getElementById('contactMessage').value;

        // Cria o corpo do e-mail
        const body = `Nome: ${name}%0D%0A%0D%0AMensagem:%0D%0A${message}`;

        // Cria o link mailto e abre o cliente de e-mail do usuário
        const mailtoLink = `mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        
        window.location.href = mailtoLink;
    });
});
