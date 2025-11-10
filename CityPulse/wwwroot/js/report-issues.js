let reports = [
    { ref: 'RPT-001', lat: -33.9249, lon: 18.4241, location: 'Cape Town CBD', status: 'reported', confirmations: { still: 0, fixed: 0 } },
    { ref: 'RPT-002', lat: -26.2041, lon: 28.0473, location: 'Johannesburg Central', status: 'needs-verification', confirmations: { still: 2, fixed: 1 } },
    { ref: 'RPT-003', lat: -29.8587, lon: 31.0218, location: 'Durban Central', status: 'resolved', confirmations: { still: 0, fixed: 3 } }
];

const statusColors = { 'reported':'red', 'needs-verification':'yellow', 'resolved':'green' };
let marker;

const map = L.map('map').setView([-30.5595, 22.9375], 5);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

const locationInput = document.getElementById('location');
const suggestions = document.getElementById('suggestions');
const steps = document.querySelectorAll('.form-step');
const progressBar = document.getElementById('formProgress');

function addReportPin(report){
    const pin = L.circleMarker([report.lat, report.lon], {
        radius: 8,
        color: statusColors[report.status],
        fillColor: statusColors[report.status],
        fillOpacity: 0.7
    }).addTo(map);

    pin.bindPopup(`
        <b>${report.location}</b><br/>
        Ref: ${report.ref}<br/>
        Status: ${report.status}
    `);
    report.pin = pin;
}

let currentStep = 0;

function showStep(stepIndex){
    steps.forEach((s,i)=> s.classList.toggle('d-none', i!==stepIndex));
    progressBar.style.width = ((stepIndex+1)/steps.length*100)+'%';
    progressBar.textContent = `Step ${stepIndex+1} of ${steps.length}`;
    checkStepFields(stepIndex);
}

function checkStepFields(stepIndex){
    const step = steps[stepIndex];
    let enable = true;
    if(stepIndex===0) enable = locationInput.value.trim() !== '';
    if(stepIndex===1) enable = document.getElementById('category').value !== '';
    step.querySelector('.next-btn').disabled = !enable;
}

function updateCompletionProgress(){
    let filled = 0;
    if(locationInput.value.trim()!=='') filled++;
    if(document.getElementById('category').value!=='') filled++;
    if(document.getElementById('description').value.trim()!=='') filled++;
    const percent = Math.round((filled/3)*100);
    progressBar.style.width = percent+'%';
}

document.querySelectorAll('.next-btn').forEach(btn=>btn.addEventListener('click', ()=>{
    if(currentStep < steps.length-1){
        currentStep++;
        showStep(currentStep);
    }
}));

document.querySelectorAll('.prev-btn').forEach(btn=>btn.addEventListener('click', ()=>{
    if(currentStep>0){
        currentStep--;
        showStep(currentStep);
    }
}));

locationInput.addEventListener('input', ()=>{
    checkStepFields(0);
    updateCompletionProgress();
});

document.getElementById('category').addEventListener('change', ()=>{
    checkStepFields(1);
    updateCompletionProgress();
});

document.getElementById('description').addEventListener('input', updateCompletionProgress);

locationInput.addEventListener('input', async function(){
    const query = locationInput.value.trim();
    suggestions.innerHTML='';
    if(query.length<1) return;
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=ZA&limit=5&addressdetails=1`);
    const data = await res.json();
    data.forEach(place=>{
        const a = document.createElement('a');
        a.href='#';
        a.className='list-group-item list-group-item-action';
        a.textContent = place.display_name;
        a.addEventListener('click', function(e){
            e.preventDefault();
            locationInput.value = place.display_name;
            suggestions.innerHTML='';
            if(marker) map.removeLayer(marker);
            marker = L.marker([place.lat, place.lon]).addTo(map);
            map.setView([place.lat, place.lon],6);
            checkStepFields(0);
        });
        suggestions.appendChild(a);
    });
});



reports.forEach(addReportPin);
showStep(currentStep);

