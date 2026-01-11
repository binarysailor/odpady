const SCHEDULE_YEAR = 2026;

let collections = [
    { date: '1-2', mixed: true, paper: true, glass: true, metal: false, bio: false },
    { date: '1-15', mixed: true, paper: false, glass: false, metal: true, bio: true },
    { date: '1-29', mixed: true, paper: true, glass: true, metal: false, bio: false },
    { date: '2-12', mixed: true, paper: false, glass: false, metal: true, bio: true },
    { date: '2-26', mixed: true, paper: true, glass: true, metal: false, bio: false },
    { date: '3-12', mixed: true, paper: false, glass: false, metal: true, bio: true },
    { date: '3-26', mixed: true, paper: true, glass: true, metal: false, bio: false }
];

const families = ['19', '19A', '19B', '21', '21A'];
const collectionsPerFamily = 2;

function assignDuties() {
    let currentFamilyIndex = 1;
    let collectionsInCurrentFamily = 0;

    collections.forEach((collection, index) => {
        if (collectionsInCurrentFamily >= collectionsPerFamily) {
            collectionsInCurrentFamily = 0;
            currentFamilyIndex = (currentFamilyIndex + 1) % families.length;
        }
        
        collection.duty = families[currentFamilyIndex];
        collectionsInCurrentFamily++;
    });
}

const wasteTypeClassMap = {
    mixed: 'mixed',
    paper: 'paper',
    glass: 'glass',
    metal: 'metal',
    bio: 'bio'
};

function populateDutyRow() {
    const dutyRow = document.querySelector('.waste-row.duty');
    if (!dutyRow) return;

    const cells = dutyRow.querySelectorAll('.collection-day');
    collections.forEach((collection, columnIndex) => {
        if (cells[columnIndex] && collection.duty) {
            cells[columnIndex].textContent = collection.duty;
        }
    });
}

function markCollectionDays() {
    collections.forEach((collection, columnIndex) => {
        Object.keys(wasteTypeClassMap).forEach(wasteType => {
            if (collection[wasteType] === true) {
                const wasteRow = document.querySelector(`.waste-row.${wasteTypeClassMap[wasteType]}`);
                if (!wasteRow) return;

                const cells = wasteRow.querySelectorAll('.collection-day');
                if (cells[columnIndex]) {
                    cells[columnIndex].classList.add('has-collection');
                }
            }
        });
    });
}

function applyFamilyFilter() {
    const selectedFamily = document.querySelector('input[name="familyFilter"]:checked')?.value || 'all';
    const dateHeaders = document.querySelectorAll('.date-header');
    const monthHeaders = document.querySelectorAll('.month-header');
    const allRows = document.querySelectorAll('.waste-row');

    dateHeaders.forEach(header => {
        header.classList.remove('dimmed');
    });
    
    monthHeaders.forEach((monthHeader) => {
        monthHeader.classList.remove('hidden');
    });

    allRows.forEach(row => {
        const cells = row.querySelectorAll('.collection-day');
        cells.forEach(cell => {
            cell.classList.remove('dimmed');
        });
    });

    if (selectedFamily === 'all') {
        return;
    }

    collections.forEach((collection, columnIndex) => {
        const shouldHighlight = collection.duty === selectedFamily;
        const dateHeader = dateHeaders[columnIndex];

        if (!shouldHighlight) {
            if (dateHeader) {
                dateHeader.classList.add('dimmed');
            }
            
            allRows.forEach(row => {
                const cells = row.querySelectorAll('.collection-day');
                if (cells[columnIndex]) {
                    cells[columnIndex].classList.add('dimmed');
                }
            });
        }
    });
}

function collectionDate(collection) {
    const [month, day] = collection.date.split('-').map(Number);
    return new Date(SCHEDULE_YEAR, month - 1, day);
}

const MONTH_NAMES = ['', 'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
                     'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'];

function groupCollectionsByMonth() {
    const grouped = {};
    collections.forEach(collection => {
        const [month] = collection.date.split('-').map(Number);
        if (!grouped[month]) {
            grouped[month] = [];
        }
        grouped[month].push(collection);
    });
    return grouped;
}

function generateTableHTML() {
    const grouped = groupCollectionsByMonth();
    const months = Object.keys(grouped).map(Number).sort((a, b) => a - b);
    
    let theadHTML = '<thead><tr><th rowspan="2" class="waste-type-header">DZIEŃ ODBIORU</th>';
    
    months.forEach(month => {
        const count = grouped[month].length;
        const monthName = MONTH_NAMES[month];
        theadHTML += `<th colspan="${count}" class="month-header">${monthName}</th>`;
    });
    theadHTML += '</tr><tr class="dates-row">';
    
    collections.forEach(collection => {
        const [, day] = collection.date.split('-').map(Number);
        theadHTML += `<th class="date-header">${day}</th>`;
    });
    theadHTML += '</tr></thead>';
    
    let tbodyHTML = '<tbody>';
    
    tbodyHTML += '<tr class="waste-row duty"><td class="waste-type duty-header">DYŻUR</td>';
    collections.forEach(() => {
        tbodyHTML += '<td class="collection-day duty-cell"></td>';
    });
    tbodyHTML += '</tr>';
    
    Object.keys(wasteTypeClassMap).forEach(wasteType => {
        const typeClass = wasteTypeClassMap[wasteType];
        const typeNames = {
            mixed: 'ODPADY ZMIESZANE',
            paper: 'PAPIER',
            glass: 'SZKŁO',
            metal: 'METALE I TWORZYWA',
            bio: 'BIOODPADY'
        };
        tbodyHTML += `<tr class="waste-row ${typeClass}">`;
        tbodyHTML += `<td class="waste-type ${typeClass}-header">${typeNames[wasteType]}</td>`;
        collections.forEach(() => {
            tbodyHTML += `<td class="collection-day ${typeClass}-cell"></td>`;
        });
        tbodyHTML += '</tr>';
    });
    
    tbodyHTML += '</tbody>';
    
    return theadHTML + tbodyHTML;
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function displayNextCollection() {
    const today = new Date();
    const section = document.getElementById('nextCollectionSection');
    
    if (today.getFullYear() !== SCHEDULE_YEAR) {
        section.style.display = 'none';
        return;
    }
    
    let latestDate = null;
    collections.forEach(collection => {
        const date = collectionDate(collection);
        if (!latestDate || date > latestDate) {
            latestDate = date;
        }
    });
    
    if (latestDate && today > latestDate) {
        section.style.display = 'none';
        return;
    }
    
    section.style.display = 'block';

    const nearestCollection = collections.find(collection => collectionDate(collection) >= today);
    const nearestDate = nearestCollection ? collectionDate(nearestCollection) : null;
    
    const dateElement = document.getElementById('nextCollectionDate');
    const familyElement = document.getElementById('nextCollectionFamily');
    
    if (nearestCollection && nearestDate) {
        dateElement.textContent = formatDate(nearestDate);
        familyElement.textContent = nearestCollection.duty;
    } else {
        dateElement.textContent = '-';
        familyElement.textContent = '-';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const table = document.getElementById('scheduleTable');
    if (table) {
        table.innerHTML = generateTableHTML();
    }
    
    assignDuties();
    populateDutyRow();
    markCollectionDays();
    displayNextCollection();
    
    const filterInputs = document.querySelectorAll('input[name="familyFilter"]');
    filterInputs.forEach(input => {
        input.addEventListener('change', applyFamilyFilter);
    });
});

