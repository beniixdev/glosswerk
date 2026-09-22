function createField(labelText, inputType, inputName, placeholder, minLength, maxLength) {
    const group = document.createElement("div");
    group.className = "form-group";

    const label = document.createElement("label");
    label.htmlFor = inputName;
    label.textContent = labelText;

    const input = document.createElement("input");
    input.type = inputType;
    input.id = inputName;
    input.name = inputName;
    input.className = "form-control";
    input.placeholder = placeholder;
    input.required = true;

    if (minLength) {
        input.minLength = minLength;
    }

    if (maxLength) {
        input.maxLength = maxLength;
    }

    group.append(label, input);
    return group;
}

function createServiceSelect() {
    const group = document.createElement("div");
    group.className = "form-group form-group-wide";

    const label = document.createElement("label");
    label.htmlFor = "service";
    label.textContent = "Szolgáltatás";

    const select = document.createElement("select");
    select.id = "service";
    select.name = "service";
    select.className = "form-select";
    select.required = true;

    const services = [
        ["", "Válassz szolgáltatást"],
        ["kulso-mosas", "Külső mosás"],
        ["belso-detailing", "Belső detailing"],
        ["gepi-polirozas", "Gépi polírozás"],
        ["keramia-bevonat", "Kerámia bevonat"]
    ];

    services.forEach(function (service) {
        const option = document.createElement("option");
        option.value = service[0];
        option.textContent = service[1];
        option.disabled = service[0] === "";
        option.selected = service[0] === "";
        select.appendChild(option);
    });

    group.append(label, select);
    return group;
}

function createMessageField() {
    const group = document.createElement("div");
    group.className = "form-group form-group-wide";

    const label = document.createElement("label");
    label.htmlFor = "message";
    label.textContent = "Megjegyzés";

    const textarea = document.createElement("textarea");
    textarea.id = "message";
    textarea.name = "message";
    textarea.className = "form-control";
    textarea.rows = 4;
    textarea.placeholder = "Például: az autón kisebb karcok találhatók...";
    textarea.required = true;
    textarea.minLength = 10;
    textarea.maxLength = 500;

    group.append(label, textarea);
    return group;
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return year + "-" + month + "-" + day;
}

function saveForm(event) {
    event.preventDefault();

    const form = event.target;
    const serviceSelect = form.elements.service;
    const result = {
        name: form.elements.name.value,
        email: form.elements.email.value,
        phone: form.elements.phone.value,
        car: form.elements.car.value,
        service: serviceSelect.options[serviceSelect.selectedIndex].text,
        date: form.elements.date.value,
        message: form.elements.message.value
    };

    localStorage.setItem("glosswerkBooking", JSON.stringify(result));
    window.location.href = "results.html";
}

function loadForm() {
    const container = document.getElementById("form-container");
    if (!container) {
        return;
    }

    const form = document.createElement("form");
    form.className = "booking-form";

    const fields = document.createElement("div");
    fields.className = "form-grid";
    fields.append(
        createField("Név", "text", "name", "Teljes név", 3, 50),
        createField("E-mail-cím", "email", "email", "pelda@email.hu", 5, 80),
        createField("Telefonszám", "tel", "phone", "+36 30 123 4567", 9, 20),
        createField("Autó típusa", "text", "car", "Például: Volkswagen Golf", 2, 50),
        createServiceSelect(),
        createField("Kívánt dátum", "date", "date", ""),
        createMessageField()
    );

    const dateInput = fields.querySelector("#date");
    const today = new Date();
    const latestDate = new Date();
    latestDate.setDate(latestDate.getDate() + 90);
    dateInput.min = formatDate(today);
    dateInput.max = formatDate(latestDate);

    const phoneInput = fields.querySelector("#phone");
    phoneInput.pattern = "[0-9+ ]{9,20}";
    phoneInput.title = "A telefonszám 9–20 karakterből, számokból, szóközből és + jelből állhat.";

    const submitButton = document.createElement("button");
    submitButton.type = "submit";
    submitButton.className = "button button-copper submit-button";
    submitButton.textContent = "Adatok áttekintése ↗";

    form.append(fields, submitButton);
    form.addEventListener("submit", saveForm);

    container.appendChild(form);
}

function createResultRow(labelText, value) {
    const row = document.createElement("div");
    row.className = "result-row";

    const label = document.createElement("strong");
    label.textContent = labelText;

    const text = document.createElement("span");
    text.textContent = value;

    row.append(label, text);
    return row;
}

function loadResults() {
    const container = document.getElementById("results-container");
    const savedResult = localStorage.getItem("glosswerkBooking");

    if (!savedResult) {
        container.textContent = "Még nincs megjeleníthető foglalási adat.";
        return;
    }

    const result = JSON.parse(savedResult);
    container.append(
        createResultRow("Név", result.name),
        createResultRow("E-mail-cím", result.email),
        createResultRow("Telefonszám", result.phone),
        createResultRow("Autó típusa", result.car),
        createResultRow("Szolgáltatás", result.service),
        createResultRow("Kívánt dátum", result.date),
        createResultRow("Megjegyzés", result.message)
    );
}

const menuToggle = document.querySelector(".menu-toggle");
const primaryNav = document.querySelector(".primary-nav");

if (menuToggle && primaryNav) {
    menuToggle.addEventListener("click", function () {
        const isOpen = primaryNav.classList.toggle("open");
        menuToggle.setAttribute("aria-expanded", String(isOpen));
        menuToggle.setAttribute("aria-label", isOpen ? "Menü bezárása" : "Menü megnyitása");
    });

    primaryNav.querySelectorAll("a").forEach(function (link) {
        link.addEventListener("click", function () {
            primaryNav.classList.remove("open");
            menuToggle.setAttribute("aria-expanded", "false");
            menuToggle.setAttribute("aria-label", "Menü megnyitása");
        });
    });
}
