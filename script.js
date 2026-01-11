// Schedule year - single source of truth
const SCHEDULE_YEAR = 2026;

// Collection schedule data
// Format: date as "month-day" (e.g., "1-2" for January 2nd, "2-12" for February 12th)
// Each date has boolean flags for each waste type
// Duty will be automatically calculated based on rotation
let collections = [
    { date: '1-2', mixed: true, paper: true, glass: true, metal: false, bio: false },
    { date: '1-15', mixed: true, paper: false, glass: false, metal: true, bio: true },
    { date: '1-29', mixed: true, paper: true, glass: true, metal: false, bio: false },
    { date: '2-12', mixed: true, paper: false, glass: false, metal: true, bio: true },
    { date: '2-26', mixed: true, paper: true, glass: true, metal: false, bio: false },
    { date: '3-12', mixed: true, paper: false, glass: false, metal: true, bio: true },
    { date: '3-26', mixed: true, paper: true, glass: true, metal: false, bio: false }
];

// Family rotation: 19 -> 19A -> 19B -> 21 -> 21A (repeat)
// Each family handles 2 consecutive collections
// 19A starts first
const families = ['19A', '19B', '21', '21A', '19'];
const collectionsPerFamily = 2;

// Calculate and assign duties to collections
function assignDuties() {
    let currentFamilyIndex = 0; // Start with 19A (index 0)
    let collectionsInCurrentFamily = 0;

    collections.forEach((collection, index) => {
        if (collectionsInCurrentFamily >= collectionsPerFamily) {
            // Move to next family in rotation
            collectionsInCurrentFamily = 0;
            currentFamilyIndex = (currentFamilyIndex + 1) % families.length;
        }
        
        collection.duty = families[currentFamilyIndex];
        collectionsInCurrentFamily++;
    });
}

// Map of waste type names to CSS class names
const wasteTypeClassMap = {
    mixed: 'mixed',
    paper: 'paper',
    glass: 'glass',
    metal: 'metal',
    bio: 'bio'
};

// Function to populate duty row
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

// Function to mark collection days in the table based on collections data
function markCollectionDays() {
    collections.forEach((collection, columnIndex) => {
        // Iterate through each waste type
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

// Function to apply family filter
function applyFamilyFilter() {
    const selectedFamily = document.querySelector('input[name="familyFilter"]:checked')?.value || 'all';
    const dateHeaders = document.querySelectorAll('.date-header');
    const monthHeaders = document.querySelectorAll('.month-header');
    const allRows = document.querySelectorAll('.waste-row');

    // Reset all columns - remove dimmed class
    dateHeaders.forEach(header => {
        header.classList.remove('dimmed');
    });
    
    // Reset month headers (colspan is set correctly by generateTableHTML)
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
        // Show all columns normally (no dimming)
        return;
    }

    // Dim columns that don't match the selected family (but keep them visible)
    collections.forEach((collection, columnIndex) => {
        const shouldHighlight = collection.duty === selectedFamily;
        const dateHeader = dateHeaders[columnIndex];

        if (!shouldHighlight) {
            // Dim columns that don't match
            if (dateHeader) {
                dateHeader.classList.add('dimmed');
            }
            
            // Dim all cells in this column (across all rows)
            allRows.forEach(row => {
                const cells = row.querySelectorAll('.collection-day');
                if (cells[columnIndex]) {
                    cells[columnIndex].classList.add('dimmed');
                }
            });
        }
    });
}

// Helper function to get Date object for a collection
function collectionDate(collection) {
    const [month, day] = collection.date.split('-').map(Number);
    return new Date(SCHEDULE_YEAR, month - 1, day);
}

// Polish month names
const MONTH_NAMES = ['', 'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
                     'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'];

// Group collections by month
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

// Generate table HTML dynamically from collections array
function generateTableHTML() {
    const grouped = groupCollectionsByMonth();
    const months = Object.keys(grouped).map(Number).sort((a, b) => a - b);
    
    let theadHTML = '<thead><tr><th rowspan="2" class="waste-type-header">DZIEŃ ODBIORU</th>';
    
    // Generate month headers
    months.forEach(month => {
        const count = grouped[month].length;
        const monthName = MONTH_NAMES[month];
        theadHTML += `<th colspan="${count}" class="month-header">${monthName}</th>`;
    });
    theadHTML += '</tr><tr class="dates-row">';
    
    // Generate date headers
    collections.forEach(collection => {
        const [, day] = collection.date.split('-').map(Number);
        theadHTML += `<th class="date-header">${day}</th>`;
    });
    theadHTML += '</tr></thead>';
    
    // Generate tbody
    let tbodyHTML = '<tbody>';
    
    // Duty row
    tbodyHTML += '<tr class="waste-row duty"><td class="waste-type duty-header">DYŻUR</td>';
    collections.forEach(() => {
        tbodyHTML += '<td class="collection-day duty-cell"></td>';
    });
    tbodyHTML += '</tr>';
    
    // Waste type rows
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

// Function to format date as yyyy-MM-dd
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Function to find and display the nearest upcoming collection
function displayNextCollection() {
    const today = new Date();
    const section = document.getElementById('nextCollectionSection');
    
    // Only show section in the schedule year (2026)
    if (today.getFullYear() !== SCHEDULE_YEAR) {
        section.style.display = 'none';
        return;
    }
    
    // Find the latest collection date
    let latestDate = null;
    collections.forEach(collection => {
        const date = collectionDate(collection);
        if (!latestDate || date > latestDate) {
            latestDate = date;
        }
    });
    
    // Hide section if current date is after the latest collection
    if (latestDate && today > latestDate) {
        section.style.display = 'none';
        return;
    }
    
    // Show section and find the nearest upcoming collection
    section.style.display = 'block';

    // Find the first collection where collectionDate >= today (collections are ordered)
    const nearestCollection = collections.find(collection => collectionDate(collection) >= today);
    const nearestDate = nearestCollection ? collectionDate(nearestCollection) : null;
    
    // Display the result
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

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Generate table structure from collections array
    const table = document.getElementById('scheduleTable');
    if (table) {
        table.innerHTML = generateTableHTML();
    }
    
    // Assign duties and populate table data
    assignDuties();
    populateDutyRow();
    markCollectionDays();
    displayNextCollection();
    
    // Setup filter event listeners
    const filterInputs = document.querySelectorAll('input[name="familyFilter"]');
    filterInputs.forEach(input => {
        input.addEventListener('change', applyFamilyFilter);
    });
});

