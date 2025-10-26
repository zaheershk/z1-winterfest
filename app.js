
const backendUrl = "https://script.google.com/macros/s/AKfycbxgDxv3yP4VJDnZkSwsxPStppQFGATZHADxUww15JIFScGOMEvtxFE4n1O7d9sf2v6S/exec";

var paymentScreenshotBytes = null;
var paymentScreenshotMimeType = null;
var reportTabClicked = null;

// Cart management
let registrationCart = [];

// Registration flow state
let currentRegistrationType = null;

const foodStallCheckboxSelector = "#date-10nov, #date-16nov, #date-17nov, #date-23nov, #date-24nov, #date-30nov, #date-1dec, #date-7dec, #date-8dec";

document.addEventListener("DOMContentLoaded", function () {
    // Clear cart data on page refresh
    localStorage.removeItem('registrationCart');
    registrationCart = [];

    // Initialize competitions display with no selection
    updateCompetitionsDisplay(null);

    // Navigation event listeners
    const navInformation = document.getElementById("nav-information");
    const navRegistration = document.getElementById("nav-registration");
    const navCheckout = document.getElementById("nav-checkout");
    const navDashboard = document.getElementById("nav-dashboard");
    const navSupport = document.getElementById("nav-support");

    if (navInformation) {
        navInformation.addEventListener("click", function () {
            switchSection("information");
        });
    }

    if (navRegistration) {
        navRegistration.addEventListener("click", function () {
            switchSection("registration");
            // If clicking registration tab directly, show participant section if not already shown
            const participantSection = document.getElementById('participantSection');
            const actionButtonsSection = document.getElementById('actionButtonsSection');
            if (participantSection && participantSection.style.display === 'none') {
                resetRegistrationForm();
                showParticipantSection();
            }
        });
    }

    if (navCheckout) {
        navCheckout.addEventListener("click", function () {
            switchSection("checkout");
        });
    }

    if (navDashboard) {
        navDashboard.addEventListener("click", function () {
            switchSection("dashboard");
        });
    }

    if (navSupport) {
        navSupport.addEventListener("click", function () {
            switchSection("support");
        });
    }

    // Information tab - Register Participant button
    const registerParticipantBtn = document.getElementById('registerParticipantBtn');
    if (registerParticipantBtn) {
        registerParticipantBtn.addEventListener('click', function () {
            switchSection('registration');
            resetRegistrationForm();
            showParticipantSection();
        });
    }

    // Registration flow event listeners
    // Note: Registration type event listeners are attached in handleContinue when the section is shown
    document.querySelectorAll('input[name="addAnother"]').forEach(radio => {
        radio.addEventListener('change', handleAddAnotherChange);
    });

    const continueBtn = document.getElementById('continueBtn');
    if (continueBtn) continueBtn.addEventListener('click', handleContinue);

    const backBtn = document.getElementById('backBtn');
    if (backBtn) backBtn.addEventListener('click', handleBack);

    const addToCartBtn = document.getElementById('addToCartBtn');
    if (addToCartBtn) addToCartBtn.addEventListener('click', handleAddToCart);

    // Next Step button (appears after filling registration details)
    const nextStepBtn = document.getElementById('nextStepBtn');
    if (nextStepBtn) nextStepBtn.addEventListener('click', handleNextStep);

    // Checkout event listeners
    const finalSubmitBtn = document.getElementById('finalSubmitBtn');
    if (finalSubmitBtn) finalSubmitBtn.addEventListener('click', handleFinalSubmit);
});

// Navigation function
function switchSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.mobile-section').forEach(section => {
        section.classList.remove('active');
    });
    // Remove active from nav buttons
    document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    // Show selected section
    document.getElementById(sectionName + '-section').classList.add('active');
    // Add active to clicked button
    document.getElementById('nav-' + sectionName).classList.add('active');

    // Special handling for registration section - only when coming from checkout
    if (sectionName === 'registration' && document.getElementById('checkout-section').classList.contains('active')) {
        // When coming from checkout, show the "add another" section to continue the flow
        document.getElementById('participantSection').style.display = 'none';
        document.getElementById('actionButtonsSection').style.display = 'none';
        document.getElementById('registrationTypeSection').style.display = 'none';
        document.getElementById('competitionsSection').style.display = 'none';
        document.getElementById('foodstallSection').style.display = 'none';
        document.getElementById('nextStepSection').style.display = 'none';
        document.getElementById('addAnotherSection').style.display = 'block';

        // Show Add to Cart button for continuing the flow
        const addToCartBtn = document.getElementById('addToCartBtn');
        if (addToCartBtn) addToCartBtn.style.display = 'inline-block';
    }

    // Special handling for checkout section
    if (sectionName === 'checkout') {
        // Reset payment option radio buttons when entering checkout
        const paymentRadios = document.querySelectorAll('input[name="checkoutPaymentOption"]');
        paymentRadios.forEach(radio => radio.checked = false);

        updatePaymentTotal();
    }
}

function resetAllInputFields() {
    const inputs = document.querySelectorAll("input");
    const selects = document.querySelectorAll("select");
    const textareas = document.querySelectorAll("textarea");

    // Reset input fields
    inputs.forEach((input) => {
        switch (input.type) {
            case "checkbox":
            case "radio":
                input.checked = input.defaultChecked;
                break;
            case "file":
                input.value = ""; // No true way to reset files in standard HTML
                break;
            default:
                input.value = input.defaultValue;
                break;
        }
    });

    // Reset select elements
    selects.forEach((select) => {
        select.value = select.selectedIndex = 0; // Reset to first option
    });

    // Reset textarea elements
    textareas.forEach((textarea) => {
        textarea.value = "";
    });
}

function updateTotalAmountDisplay() {
    const option1Selected = document.getElementById("option1").checked;
    const totalContainer = document.getElementById("totalCharge");

    totalContainer.style.display = "none";
    if (option1Selected) {
        const total = calculateFoodStallCount() * 800 + 700;
        totalContainer.textContent = `Total Amount to be paid: INR ${total}`;
        totalContainer.style.display = "block";
    }
}

function calculateFoodStallCount() {
    const checkboxes = document.querySelectorAll(foodStallCheckboxSelector);
    let count = 0;
    checkboxes.forEach((cb) => {
        if (cb.checked) {
            count++;
        }
    });
    return count;
}

function updateCompetitionsDisplay(selectedAgeGroup) {
    const container = document.getElementById("competitionsContainer");
    container.innerHTML = ""; // Clear current contents

    if (!selectedAgeGroup) {
        // Show message when no age group is selected
        container.innerHTML = `
            <div class="alert alert-info" role="alert">
                <i class="fas fa-info-circle"></i> Please select an age group above to view available competitions.
            </div>
        `;
        return;
    }

    competitionsData.forEach((category) => {
        const categoryElem = document.createElement("div");
        categoryElem.classList.add("category-block");
        const header = document.createElement("div");
        header.className = "category-header";
        header.textContent = category.category;
        categoryElem.appendChild(header);

        let hasVisibleCompetitions = false;

        category.competitions.forEach((comp) => {
            if (comp.ageGroups.includes(selectedAgeGroup)) {
                hasVisibleCompetitions = true;
                const checkboxId = `comp-${comp.name.replace(/\s+/g, "-")}`;
                const compElement = document.createElement("div");
                compElement.className = "form-check";
                compElement.innerHTML = `
                    <input class="form-check-input" type="checkbox" id="${checkboxId}" name="competitions" value="${comp.name}">
                    <label class="form-check-label" for="${checkboxId}">${comp.name}</label>
                `;

                if (comp.teamBased) {
                    const inputTeamMembers = document.createElement("input");
                    inputTeamMembers.id = `team-${checkboxId}`;
                    inputTeamMembers.className = "form-control mt-2";
                    inputTeamMembers.placeholder = "Enter team member names & flat numbers";
                    inputTeamMembers.required = true; // Make input field required
                    inputTeamMembers.style.display = "none"; // Initially hide the input field

                    // Label for age groups
                    const ageGroupLabel = document.createElement("label");
                    ageGroupLabel.className = "form-label mt-2";
                    ageGroupLabel.textContent = `Age Groups: ${comp.displayAgeGroups}`;
                    ageGroupLabel.style.display = "none"; // Initially hide the label

                    // Insert age group label before the team members input field
                    compElement.appendChild(ageGroupLabel);
                    compElement.appendChild(inputTeamMembers);

                    // Toggle visibility of age group label and input based on the checkbox
                    compElement.querySelector('input[type="checkbox"]').onchange = function () {
                        const displayStyle = this.checked ? "block" : "none";
                        inputTeamMembers.style.display = displayStyle;
                        ageGroupLabel.style.display = displayStyle;
                    };
                }
                categoryElem.appendChild(compElement);
            }
        });

        if (hasVisibleCompetitions) {
            container.appendChild(categoryElem);
            categoryElem.style.display = "block";
        }
    });
}

function loadDataAndApplyAutocomplete() {
    let allNames = localStorage.getItem('allNames');
    let allApartments = localStorage.getItem('allApartments');

    if (!allNames || !allApartments) {
        // Fetch Names if not already in local storage
        $.getJSON(backendUrl + "?type=registrationData&property=name", function (data) {
            allNames = JSON.stringify(data);
            localStorage.setItem('allNames', allNames);
            applyAutocompleteNames(JSON.parse(allNames));
        });

        // Fetch Apartments if not already in local storage
        $.getJSON(backendUrl + "?type=registrationData&property=apartment", function (data) {
            allApartments = JSON.stringify(data);
            localStorage.setItem('allApartments', allApartments);
            applyAutocompleteApartments(JSON.parse(allApartments));
        });
    } else {
        applyAutocompleteNames(JSON.parse(allNames));
        applyAutocompleteApartments(JSON.parse(allApartments));
    }
}

function applyAutocompleteNames(namesData) {
    $("input[id^='firstPlaceName'], input[id^='secondPlaceName']").autocomplete({
        source: namesData,
        minLength: 1
    });
}

function applyAutocompleteApartments(apartmentsData) {
    $("input[id^='firstPlaceApartment'], input[id^='secondPlaceApartment']").autocomplete({
        source: apartmentsData,
        minLength: 1
    });
}

// Registration flow functions
function resetRegistrationForm() {
    const form = document.getElementById('registrationForm');
    if (form) form.reset();

    // Reset all sections visibility
    document.getElementById('participantSection').style.display = 'block';
    document.getElementById('actionButtonsSection').style.display = 'block';
    document.getElementById('registrationTypeSection').style.display = 'none';
    document.getElementById('competitionsSection').style.display = 'none';
    document.getElementById('foodstallSection').style.display = 'none';
    document.getElementById('nextStepSection').style.display = 'none';
    document.getElementById('addAnotherSection').style.display = 'none';

    // Reset button states
    const continueBtn = document.getElementById('continueBtn');
    const backBtn = document.getElementById('backBtn');
    const addToCartBtn = document.getElementById('addToCartBtn');

    if (continueBtn) continueBtn.style.display = 'inline-block';
    if (backBtn) backBtn.style.display = 'inline-block';
    if (addToCartBtn) addToCartBtn.style.display = 'none';

    currentRegistrationType = null;
}

function resetParticipantSpecificFields() {
    // Only reset participant-specific fields, keep flat info for multiple registrations
    const nameField = document.getElementById('name');
    if (nameField) nameField.value = '';

    // Reset gender radio buttons
    const genderRadios = document.querySelectorAll('input[name="gender"]');
    genderRadios.forEach(radio => radio.checked = false);

    // Reset age group radio buttons
    const ageGroupRadios = document.querySelectorAll('input[name="ageGroup"]');
    ageGroupRadios.forEach(radio => radio.checked = false);

    // Reset registration type radio buttons
    const registrationTypeRadios = document.querySelectorAll('input[name="registrationType"]');
    registrationTypeRadios.forEach(radio => radio.checked = false);

    // Reset competitions checkboxes
    const competitionCheckboxes = document.querySelectorAll('input[name="competitions"]');
    competitionCheckboxes.forEach(checkbox => checkbox.checked = false);

    // Reset food stall date checkboxes
    const foodStallCheckboxes = document.querySelectorAll('input[id^="date-"]');
    foodStallCheckboxes.forEach(checkbox => checkbox.checked = false);

    // Reset food menu textarea
    const foodMenuField = document.getElementById('foodMenu');
    if (foodMenuField) foodMenuField.value = '';

    // Reset all sections visibility back to participant section
    document.getElementById('participantSection').style.display = 'block';
    document.getElementById('actionButtonsSection').style.display = 'block';
    document.getElementById('registrationTypeSection').style.display = 'none';
    document.getElementById('competitionsSection').style.display = 'none';
    document.getElementById('foodstallSection').style.display = 'none';
    document.getElementById('nextStepSection').style.display = 'none';
    document.getElementById('addAnotherSection').style.display = 'none';

    // Reset button states
    const continueBtn = document.getElementById('continueBtn');
    const backBtn = document.getElementById('backBtn');
    const addToCartBtn = document.getElementById('addToCartBtn');

    if (continueBtn) continueBtn.style.display = 'inline-block';
    if (backBtn) backBtn.style.display = 'inline-block';
    if (addToCartBtn) addToCartBtn.style.display = 'none';

    currentRegistrationType = null;
}

function showParticipantSection() {
    document.getElementById('participantSection').style.display = 'block';
    document.getElementById('actionButtonsSection').style.display = 'block';
    const continueBtn = document.getElementById('continueBtn');
    if (continueBtn) {
        continueBtn.style.display = 'inline-block';
    }

    const backBtn = document.getElementById('backBtn');
    if (backBtn) backBtn.style.display = 'inline-block';
}

function handleAddAnotherChange() {
    // This function is called when the user selects an option in the add another section
    // The actual logic is handled in handleAddToCart when the user clicks "Add to Cart"
}

function handleRegistrationTypeChange() {
    const selectedRadio = document.querySelector('input[name="registrationType"]:checked');
    if (!selectedRadio) {
        return;
    }

    currentRegistrationType = selectedRadio.value;

    if (currentRegistrationType === 'competition') {
        document.getElementById('competitionsSection').style.display = 'block';
        document.getElementById('foodstallSection').style.display = 'none';
    } else if (currentRegistrationType === 'foodstall') {
        document.getElementById('foodstallSection').style.display = 'block';
        document.getElementById('competitionsSection').style.display = 'none';
    }

    // Show the Next Step button when registration type is selected
    const nextStepSection = document.getElementById('nextStepSection');
    nextStepSection.style.display = 'block';
}

function handleNextStep() {
    if (validateRegistrationDetails()) {
        document.getElementById('registrationTypeSection').style.display = 'none';
        document.getElementById('competitionsSection').style.display = 'none';
        document.getElementById('foodstallSection').style.display = 'none';
        document.getElementById('nextStepSection').style.display = 'none';
        document.getElementById('addAnotherSection').style.display = 'block';

        // Show the Add to Cart button
        const addToCartBtn = document.getElementById('addToCartBtn');
        if (addToCartBtn) addToCartBtn.style.display = 'inline-block';
    }
}

function validateRegistrationDetails() {
    if (currentRegistrationType === 'competition') {
        const selectedCompetitions = document.querySelectorAll('input[name="competitions"]:checked');
        if (selectedCompetitions.length === 0) {
            alert('Please select at least one competition.');
            return false;
        }
    } else if (currentRegistrationType === 'foodstall') {
        const selectedDates = document.querySelectorAll('input[id^="date-"]:checked');
        if (selectedDates.length === 0) {
            alert('Please select at least one date for your food stall.');
            return false;
        }

        const foodMenu = document.getElementById('foodMenu').value.trim();
        if (!foodMenu) {
            alert('Please enter your food menu.');
            return false;
        }
    }

    return true;
}

function handleContinue() {
    if (validateParticipantForm()) {
        // Hide participant section and show registration type selection
        document.getElementById('participantSection').style.display = 'none';
        document.getElementById('registrationTypeSection').style.display = 'block';
        document.getElementById('nextStepSection').style.display = 'block'; // Show initially

        // Attach event listeners to registration type radio buttons
        const radioButtons = document.querySelectorAll('input[name="registrationType"]');
        radioButtons.forEach(radio => {
            radio.addEventListener('change', handleRegistrationTypeChange);
            radio.addEventListener('click', handleRegistrationTypeChange);
        });

        // Also attach to labels for better UX
        const labels = document.querySelectorAll('label[for="competitionType"], label[for="foodstallType"]');
        labels.forEach(label => {
            label.addEventListener('click', function () {
                setTimeout(handleRegistrationTypeChange, 10); // Small delay to let radio button update
            });
        });

        // Update button states
        const continueBtn = document.getElementById('continueBtn');
        const backBtn = document.getElementById('backBtn');

        if (continueBtn) continueBtn.style.display = 'none';
        if (backBtn) backBtn.style.display = 'inline-block';
    }
}

function handleBack() {
    if (document.getElementById('addAnotherSection').style.display === 'block') {
        // Go back to registration details
        document.getElementById('addAnotherSection').style.display = 'none';
        document.getElementById('nextStepSection').style.display = 'block';

        // Show the appropriate section based on current registration type
        if (currentRegistrationType === 'competition') {
            document.getElementById('competitionsSection').style.display = 'block';
        } else if (currentRegistrationType === 'foodstall') {
            document.getElementById('foodstallSection').style.display = 'block';
        }

        // Hide Add to Cart button
        const addToCartBtn = document.getElementById('addToCartBtn');
        if (addToCartBtn) addToCartBtn.style.display = 'none';

    } else if (document.getElementById('nextStepSection').style.display === 'block' ||
        document.getElementById('competitionsSection').style.display === 'block' ||
        document.getElementById('foodstallSection').style.display === 'block') {
        // Go back to registration type selection
        document.getElementById('registrationTypeSection').style.display = 'block';
        document.getElementById('competitionsSection').style.display = 'none';
        document.getElementById('foodstallSection').style.display = 'none';
        document.getElementById('nextStepSection').style.display = 'none';

        // Reset registration type radio buttons when going back to registration type selection
        const registrationTypeRadios = document.querySelectorAll('input[name="registrationType"]');
        registrationTypeRadios.forEach(radio => radio.checked = false);

    } else if (document.getElementById('registrationTypeSection').style.display === 'block') {
        // Go back to participant info
        document.getElementById('registrationTypeSection').style.display = 'none';
        document.getElementById('participantSection').style.display = 'block';

        // Reset age group radio buttons when going back to participant info
        const ageGroupRadios = document.querySelectorAll('input[name="ageGroup"]');
        ageGroupRadios.forEach(radio => radio.checked = false);
        // Reset competitions display
        updateCompetitionsDisplay(null);

        // Show Continue button, hide Add to Cart button
        const continueBtn = document.getElementById('continueBtn');
        const addToCartBtn = document.getElementById('addToCartBtn');

        if (continueBtn) continueBtn.style.display = 'inline-block';
        if (addToCartBtn) addToCartBtn.style.display = 'none';

    } else {
        switchSection('information');
    }
}

function handleAddToCart() {
    const addAnotherYes = document.getElementById('addAnotherYes').checked;
    const addAnotherNo = document.getElementById('addAnotherNo').checked;

    if (!addAnotherYes && !addAnotherNo) {
        alert('Please select an option for adding another participant.');
        return;
    }

    if (validateParticipantForm()) {
        const participant = collectParticipantData();
        registrationCart.push(participant);
        saveCartToStorage();
        updateCartDisplay();

        if (addAnotherYes) {
            // Reset only participant-specific fields and go back to participant info
            resetParticipantSpecificFields();
            showParticipantSection();
        } else if (addAnotherNo) {
            // Navigate to checkout
            switchSection('checkout');
        }
    }
}

function validateParticipantForm() {
    // Validate basic participant info
    const name = document.getElementById('name') ? document.getElementById('name').value.trim() : '';
    const flat = document.getElementById('flat') ? document.getElementById('flat').value.trim() : '';
    const phone = document.getElementById('phoneNumber') ? document.getElementById('phoneNumber').value.trim() : '';

    if (!name || !flat || !phone) {
        alert('Please fill in all required participant information fields.');
        return false;
    }

    return true;
}

function collectParticipantData() {
    const data = {
        name: document.getElementById('name').value.trim(),
        flat: document.getElementById('flat').value.trim(),
        phone: document.getElementById('phoneNumber').value.trim(),
        email: document.getElementById('email').value.trim(),
        tower: document.getElementById('tower').value,
        gender: document.querySelector('input[name="gender"]:checked').value,
        ageGroup: document.querySelector('input[name="ageGroup"]:checked').value,
        registrationType: currentRegistrationType,
        timestamp: new Date().toISOString()
    };

    if (currentRegistrationType === 'competition') {
        // Format competitions as array of objects with Category, Name, and Team Info
        data.competitions = [];
        const checkedCompetitions = document.querySelectorAll('input[name="competitions"]:checked');

        checkedCompetitions.forEach(cb => {
            // Find the category for this competition
            let category = '';
            competitionsData.forEach(cat => {
                const comp = cat.competitions.find(c => c.name === cb.value);
                if (comp) {
                    category = cat.category;
                }
            });

            // Get team info if it's a team-based competition
            let teamInfo = 'N/A';
            const teamInputId = `team-comp-${cb.value.replace(/\s+/g, "-")}`;
            const teamInput = document.getElementById(teamInputId);
            if (teamInput && teamInput.value.trim()) {
                teamInfo = teamInput.value.trim();
            }

            data.competitions.push({
                Category: category,
                Name: cb.value,
                "Team Info": teamInfo
            });
        });
    } else if (currentRegistrationType === 'foodstall') {
        // Format food stalls as object with Menu and Dates
        data.foodStalls = {
            Menu: document.getElementById('foodMenu').value.trim(),
            Dates: Array.from(document.querySelectorAll('input[id^="date-"]:checked')).map(cb => cb.value)
        };
    }

    return data;
}

function saveCartToStorage() {
    localStorage.setItem('registrationCart', JSON.stringify(registrationCart));
}

function updateCartDisplay() {
    const cartTableBody = document.getElementById('cartTableBody');
    if (!cartTableBody) return;

    cartTableBody.innerHTML = '';

    if (registrationCart.length === 0) {
        cartTableBody.innerHTML = '<tr><td colspan="4" class="text-muted">No participants registered yet. Add participants from the Registration tab.</td></tr>';
        document.getElementById('flatDisplay').style.display = 'none';
        return;
    }

    // Display flat number
    if (registrationCart.length > 0) {
        const firstParticipant = registrationCart[0];
        const flatDisplay = `${firstParticipant.tower} - ${firstParticipant.flat}`;
        document.getElementById('flatNumberDisplay').textContent = flatDisplay;
        document.getElementById('flatDisplay').style.display = 'block';
    }

    // Display cart items
    registrationCart.forEach((participant, index) => {
        const row = document.createElement('tr');

        let details = '';

        if (participant.registrationType === 'competition') {
            details = participant.competitions.map(comp =>
                `<div class="competition-item">
                    <strong>${comp.Name}</strong> (${comp.Category})
                    ${comp["Team Info"] !== 'N/A' ? `<br><small class="text-muted">Team: ${comp["Team Info"]}</small>` : ''}
                </div>`
            ).join('');
        } else if (participant.registrationType === 'foodstall') {
            details = `<div class="foodstall-item">
                <strong>Menu:</strong> ${participant.foodStalls.Menu}
                <br><strong>Dates:</strong> ${participant.foodStalls.Dates.map(date => `<span class="badge bg-secondary">${date}</span>`).join(' ')}
            </div>`;
        }

        row.innerHTML = `
            <td>${participant.name}</td>
            <td>${participant.ageGroup}</td>
            <td>${details}</td>
            <td><button class="modern-btn" onclick="removeFromCart(${index})"><i class="fas fa-trash"></i></button></td>
        `;

        cartTableBody.appendChild(row);
    });

    // Update total amount in payment section
    updatePaymentTotal();
}

function updatePaymentTotal() {
    const checkoutTotalCharge = document.getElementById('checkoutTotalCharge');
    if (!checkoutTotalCharge) return;

    let totalAmount = 0;
    let hasCompetitions = false;
    let foodStallDays = 0;

    // Calculate totals
    registrationCart.forEach((participant) => {
        if (participant.registrationType === 'competition') {
            hasCompetitions = true;
        } else if (participant.registrationType === 'foodstall') {
            foodStallDays += participant.foodStalls.Dates.length;
        }
    });

    if (hasCompetitions) {
        totalAmount += 700; // ₹700 flat fee for competitions per flat/family
    }

    if (foodStallDays > 0) {
        totalAmount += foodStallDays * 800; // ₹800 per day for food stalls
    }

    checkoutTotalCharge.textContent = `Total Amount to be paid: INR ${totalAmount}`;
}

function removeFromCart(index) {
    registrationCart.splice(index, 1);
    saveCartToStorage();
    updateCartDisplay();
}

function handleFinalSubmit() {
    const rulesAccepted = document.getElementById('checkoutAcknowledge') ? document.getElementById('checkoutAcknowledge').checked : false;
    const paymentMethod = document.querySelector('input[name="checkoutPaymentOption"]:checked');

    if (!rulesAccepted) {
        alert('Please accept the rules and regulations.');
        return;
    }

    if (!paymentMethod) {
        alert('Please select a payment method.');
        return;
    }

    if (registrationCart.length === 0) {
        alert('Your cart is empty. Please add participants first.');
        return;
    }

    // Collect payment proof if required
    const paymentData = {
        method: paymentMethod.value,
        proof: null
    };

    if (paymentMethod.value === 'I will pay for participation and/or food stall now.') {
        const proofFile = document.getElementById('checkoutPaymentConfirmation');
        if (proofFile && proofFile.files[0]) {
            paymentData.proof = proofFile.files[0];
        } else {
            // COMMENTED OUT FOR TESTING - allow submission without payment proof
            // alert('Please upload payment proof for payment.');
            // return;
        }
    }

    // Submit all registrations
    submitAllRegistrations(paymentData);
}

async function submitAllRegistrations(paymentData) {
    try {
        // Show loading state
        const finalSubmitBtn = document.getElementById('finalSubmitBtn');
        if (finalSubmitBtn) {
            finalSubmitBtn.disabled = true;
            finalSubmitBtn.textContent = 'Submitting...';
        }

        // Show loading overlay and spinner
        const loadingOverlay = document.getElementById('loadingOverlay');
        const loadingSpinner = document.getElementById('loadingSpinner');
        if (loadingOverlay) loadingOverlay.hidden = false;
        if (loadingSpinner) loadingSpinner.hidden = false;

        // Disable navigation buttons
        const navButtons = document.querySelectorAll('.mobile-nav-btn');
        navButtons.forEach(btn => btn.disabled = true);

        // Handle payment proof - convert file to base64 once for all participants
        let paymentProofBase64 = null;
        let paymentProofType = null;
        if (paymentData.proof) {
            paymentProofBase64 = await fileToBase64(paymentData.proof);
            paymentProofType = paymentData.proof.type;
        }

        // Prepare batch data with all participants
        const batchData = {
            participants: registrationCart,
            paymentMethod: paymentData.method,
            paymentProof: paymentProofBase64,
            paymentProofType: paymentProofType
        };

        console.log('Submitting batch data:', batchData); // Debug log

        const response = await fetch(backendUrl, {
            method: 'POST',
            mode: "cors",
            cache: "no-cache",
            headers: {
                "Content-Type": "text/plain",
            },
            redirect: "follow",
            body: JSON.stringify(batchData)
        });

        console.log('Response status:', response.status); // Debug log
        const result = await response.json();
        console.log('Response data:', result); // Debug log

        if (result.status === 'success' || result.status === 'partial_success') {
            const successCount = result.results ? result.results.filter(r => r.status === 'success').length : registrationCart.length;
            const totalCount = registrationCart.length;

            if (result.status === 'success') {
                alert('All registrations submitted successfully!');
            } else {
                alert(`${successCount}/${totalCount} registrations submitted successfully. Some failed - check console for details.`);
            }

            // Clear cart and redirect to dashboard regardless of partial failures
            registrationCart = [];
            saveCartToStorage();
            updateCartDisplay();
            switchSection('dashboard');
        } else {
            alert('Registration failed: ' + (result.error || 'Unknown error'));
        }

    } catch (error) {
        console.error('Submission error:', error);
        alert('An error occurred during submission. Please try again.');
    } finally {
        const finalSubmitBtn = document.getElementById('finalSubmitBtn');
        if (finalSubmitBtn) {
            finalSubmitBtn.disabled = false;
            finalSubmitBtn.textContent = 'Submit Registrations';
        }

        // Hide loading overlay and spinner
        const loadingOverlay = document.getElementById('loadingOverlay');
        const loadingSpinner = document.getElementById('loadingSpinner');
        if (loadingOverlay) loadingOverlay.hidden = true;
        if (loadingSpinner) loadingSpinner.hidden = true;

        // Re-enable navigation buttons
        const navButtons = document.querySelectorAll('.mobile-nav-btn');
        navButtons.forEach(btn => btn.disabled = false);
    }
}

// Helper function to convert file to base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = error => reject(error);
    });
}