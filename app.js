
const backendUrl = "https://script.google.com/macros/s/AKfycbym2smzMABnem_IImW_iUiNgTsPZQhMRcv5MXUzyjDCxG8uf498og3_Eler2Zmhr7qn/exec";

var paymentScreenshotBytes = null;
var paymentScreenshotMimeType = null;
var reportTabClicked = null;

// Cart management
let registrationCart = [];

// Registration flow state
let currentRegistrationType = null;
let currentCheckoutStep = 1; // 1: Summary, 2: Acknowledgement, 3: Payment

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

    // Checkout tab - Register Participant button
    const registerParticipantBtnCheckout = document.getElementById('registerParticipantBtnCheckout');
    if (registerParticipantBtnCheckout) {
        registerParticipantBtnCheckout.addEventListener('click', function () {
            // Set tower and flat from existing cart data before resetting
            if (registrationCart.length > 0) {
                const firstParticipant = registrationCart[0];
                const towerField = document.getElementById('tower');
                const flatField = document.getElementById('flat');
                if (towerField) towerField.value = firstParticipant.tower;
                if (flatField) flatField.value = firstParticipant.flat;
            }
            
            // Reset registration sections visibility (similar to resetRegistrationForm but keep tower/flat disabled)
            const participantSection = document.getElementById('participantSection');
            const actionButtonsSection = document.getElementById('actionButtonsSection');
            const registrationTypeSection = document.getElementById('registrationTypeSection');
            const competitionsSection = document.getElementById('competitionsSection');
            const foodstallSection = document.getElementById('foodstallSection');
            const nextStepSection = document.getElementById('nextStepSection');
            const addAnotherSection = document.getElementById('addAnotherSection');
            const foodStallQuestionSection = document.getElementById('foodStallQuestionSection');

            if (participantSection) participantSection.style.display = 'block';
            if (actionButtonsSection) actionButtonsSection.style.display = 'block';
            if (registrationTypeSection) registrationTypeSection.style.display = 'none';
            if (competitionsSection) competitionsSection.style.display = 'none';
            if (foodstallSection) foodstallSection.style.display = 'none';
            if (nextStepSection) nextStepSection.style.display = 'none';
            if (addAnotherSection) addAnotherSection.style.display = 'none';
            if (foodStallQuestionSection) foodStallQuestionSection.style.display = 'none';

            // Reset button states
            const continueBtn = document.getElementById('continueBtn');
            const backBtn = document.getElementById('backBtn');
            const addToCartBtn = document.getElementById('addToCartBtn');
            if (continueBtn) continueBtn.style.display = 'inline-block';
            if (backBtn) backBtn.style.display = 'none';
            if (addToCartBtn) addToCartBtn.style.display = 'none';

            // Reset flow state
            currentRegistrationType = null;
            updateCompetitionsDisplay(null);

            switchSection('registration');
            resetParticipantSpecificFields();
            showParticipantSection();
        });
    }

    // Registration flow event listeners
    // Note: Registration type event listeners are attached in handleContinue when the section is shown
    document.querySelectorAll('input[name="addAnother"]').forEach(radio => {
        radio.addEventListener('change', handleAddAnotherChange);
    });

    // Food stall question event listeners
    document.querySelectorAll('input[name="foodStallInterest"]').forEach(radio => {
        radio.addEventListener('change', handleFoodStallInterestChange);
    });

    const continueBtn = document.getElementById('continueBtn');
    if (continueBtn) continueBtn.addEventListener('click', handleContinue);

    const backBtn = document.getElementById('backBtn');
    if (backBtn) backBtn.addEventListener('click', handleBack);

    const addToCartBtn = document.getElementById('addToCartBtn');
    // Removed event listener since we moved logic to radio button change
    // if (addToCartBtn) addToCartBtn.addEventListener('click', handleAddToCart);

    // Checkout navigation event listeners
    const checkoutNextBtn = document.getElementById('checkoutNextBtn');
    if (checkoutNextBtn) checkoutNextBtn.addEventListener('click', handleCheckoutNext);

    const checkoutBackBtn = document.getElementById('checkoutBackBtn');
    if (checkoutBackBtn) checkoutBackBtn.addEventListener('click', handleCheckoutBack);

    const paymentBackBtn = document.getElementById('paymentBackBtn');
    if (paymentBackBtn) paymentBackBtn.addEventListener('click', handleCheckoutBack);

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
        // When coming from checkout, reset the entire form
        resetRegistrationForm();
    }

    // Special handling for checkout section
    if (sectionName === 'checkout') {
        // Reset to first step of checkout wizard
        currentCheckoutStep = 1;
        updateCheckoutStepVisibility();

        // Deduplicate cart before showing checkout to prevent duplicate entries
        deduplicateCart();

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

function handleAgeGroupChange(selectedAgeGroup) {
    // Update competitions display
    updateCompetitionsDisplay(selectedAgeGroup);

    // Show appropriate section based on registration type
    if (selectedAgeGroup) {
        if (currentRegistrationType === 'foodstall') {
            // In food stall mode - show food stall section directly
            document.getElementById('foodstallSection').style.display = 'block';
            document.getElementById('nextStepSection').style.display = 'block';
            // Hide action buttons
            document.getElementById('actionButtonsSection').style.display = 'none';
        } else {
            // Default competition flow
            document.getElementById('competitionsSection').style.display = 'block';
            document.getElementById('nextStepSection').style.display = 'block';
            // Hide action buttons when showing competitions
            document.getElementById('actionButtonsSection').style.display = 'none';
            // Set registration type for competitions
            currentRegistrationType = 'competition';
        }
    }
}function loadDataAndApplyAutocomplete() {
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

    // Enable Tower and Flat fields for new registration
    const towerField = document.getElementById('tower');
    const flatField = document.getElementById('flat');
    if (towerField) towerField.disabled = false;
    if (flatField) flatField.disabled = false;

    // Reset all sections visibility
    const participantSection = document.getElementById('participantSection');
    const actionButtonsSection = document.getElementById('actionButtonsSection');
    const registrationTypeSection = document.getElementById('registrationTypeSection');
    const competitionsSection = document.getElementById('competitionsSection');
    const foodstallSection = document.getElementById('foodstallSection');
    const nextStepSection = document.getElementById('nextStepSection');
    const addAnotherSection = document.getElementById('addAnotherSection');
    const foodStallQuestionSection = document.getElementById('foodStallQuestionSection');

    if (participantSection) participantSection.style.display = 'block';
    if (actionButtonsSection) actionButtonsSection.style.display = 'block';
    if (registrationTypeSection) registrationTypeSection.style.display = 'none';
    if (competitionsSection) competitionsSection.style.display = 'none';
    if (foodstallSection) foodstallSection.style.display = 'none';
    if (nextStepSection) nextStepSection.style.display = 'none';
    if (addAnotherSection) addAnotherSection.style.display = 'none';
    if (foodStallQuestionSection) foodStallQuestionSection.style.display = 'none';

    // Reset button states
    const continueBtn = document.getElementById('continueBtn');
    const backBtn = document.getElementById('backBtn');
    const addToCartBtn = document.getElementById('addToCartBtn');

    if (continueBtn) continueBtn.style.display = 'inline-flex';
    if (backBtn) backBtn.style.display = 'none';
    if (addToCartBtn) addToCartBtn.style.display = 'none';

    currentRegistrationType = null;
}

function resetParticipantSpecificFields() {
    // Only reset participant-specific fields, keep flat info for multiple registrations
    const nameField = document.getElementById('name');
    if (nameField) nameField.value = '';

    // Reset age field
    const ageField = document.getElementById('age');
    if (ageField) ageField.value = '';

    // Lock Tower and Flat fields to prevent changes during multi-participant registration
    const towerField = document.getElementById('tower');
    const flatField = document.getElementById('flat');
    if (towerField) towerField.disabled = true;
    if (flatField) flatField.disabled = true;

    // Reset gender radio buttons
    const genderRadios = document.querySelectorAll('input[name="gender"]');
    genderRadios.forEach(radio => radio.checked = false);

    // Reset age group radio buttons
    const ageGroupRadios = document.querySelectorAll('input[name="ageGroup"]');
    ageGroupRadios.forEach(radio => radio.checked = false);

    // Reset registration type radio buttons
    const registrationTypeRadios = document.querySelectorAll('input[name="registrationType"]');
    registrationTypeRadios.forEach(radio => radio.checked = false);

    // Reset add another radio buttons
    const addAnotherRadios = document.querySelectorAll('input[name="addAnother"]');
    addAnotherRadios.forEach(radio => radio.checked = false);

    // Reset food stall interest radio buttons
    const foodStallInterestRadios = document.querySelectorAll('input[name="foodStallInterest"]');
    foodStallInterestRadios.forEach(radio => radio.checked = false);

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
    const addAnotherYes = document.getElementById('addAnotherYes').checked;
    const addAnotherNo = document.getElementById('addAnotherNo').checked;

    if (!addAnotherYes && !addAnotherNo) {
        return; // No selection made yet
    }

    if (validateParticipantForm()) {
        const participant = collectParticipantData();
        addToCart(participant);

        if (addAnotherYes) {
            // Reset only participant-specific fields and go back to participant info
            resetParticipantSpecificFields();
            showParticipantSection();
        } else if (addAnotherNo) {
            // Show food stall question instead of going directly to checkout
            document.getElementById('addAnotherSection').style.display = 'none';
            document.getElementById('foodStallQuestionSection').style.display = 'block';
            document.getElementById('actionButtonsSection').style.display = 'block';
            
            // Update button states - hide Add to Cart, show Continue
            const addToCartBtn = document.getElementById('addToCartBtn');
            const continueBtn = document.getElementById('continueBtn');
            if (addToCartBtn) addToCartBtn.style.display = 'none';
            if (continueBtn) continueBtn.style.display = 'inline-block';
        }
    }
}

function handleFoodStallInterestChange() {
    const foodStallYes = document.getElementById('foodStallYes').checked;
    const foodStallNo = document.getElementById('foodStallNo').checked;

    if (!foodStallYes && !foodStallNo) {
        return; // No selection made yet
    }

    if (foodStallYes) {
        // Partially reset form like "add another participant" scenario
        resetParticipantSpecificFields();
        
        // Unlock Tower and Flat fields for food stall registration (different person/flat might register)
        const towerField = document.getElementById('tower');
        const flatField = document.getElementById('flat');
        if (towerField) towerField.disabled = false;
        if (flatField) flatField.disabled = false;
        
        showParticipantSection();
        currentRegistrationType = 'foodstall';

        // Hide food stall question section since user selected yes
        document.getElementById('foodStallQuestionSection').style.display = 'none';

        // DO NOT show food stall section yet - wait until participant info is filled
        // document.getElementById('foodstallSection').style.display = 'block';
        // document.getElementById('nextStepSection').style.display = 'block';
    } else if (foodStallNo) {
        // User doesn't want food stall either - go directly to checkout
        switchSection('checkout');
    }
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
    if (nextStepSection) nextStepSection.style.display = 'block';
}

function handleNextStep() {
    if (document.getElementById('competitionsSection').style.display === 'block') {
        // Coming from competitions - validate and go to add another
        const selectedCompetitions = document.querySelectorAll('input[name="competitions"]:checked');
        if (selectedCompetitions.length === 0) {
            alert('Please select at least one competition.');
            return;
        }

        // Collect participant data and add to cart
        const participantData = collectParticipantData();
        addToCart(participantData);

        // Hide competitions and next step sections, show add another question
        document.getElementById('competitionsSection').style.display = 'none';
        document.getElementById('nextStepSection').style.display = 'none';
        document.getElementById('addAnotherSection').style.display = 'block';

        // Reset add another radio buttons to unchecked state
        const addAnotherYes = document.getElementById('addAnotherYes');
        const addAnotherNo = document.getElementById('addAnotherNo');
        if (addAnotherYes) addAnotherYes.checked = false;
        if (addAnotherNo) addAnotherNo.checked = false;

        // Hide action buttons since radio selection will handle the logic
        document.getElementById('actionButtonsSection').style.display = 'none';

    } else if (document.getElementById('foodstallSection').style.display === 'block') {
        // Coming from food stall details - validate participant info and food stall details, then go to checkout
        if (!validateParticipantForm()) {
            return;
        }
        
        const selectedDates = document.querySelectorAll('input[id^="date-"]:checked');
        if (selectedDates.length === 0) {
            alert('Please select at least one date for your food stall.');
            return;
        }

        const foodMenu = document.getElementById('foodMenu').value.trim();
        if (!foodMenu) {
            alert('Please enter your food menu.');
            return;
        }

        // Collect food stall data and add to cart
        const foodStallData = collectFoodStallData();
        addToCart(foodStallData);

        // Go directly to checkout
        switchSection('checkout');
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
    // Check if we're in food stall registration mode
    if (currentRegistrationType === 'foodstall') {
        // Validate participant form and then show food stall section
        if (validateParticipantForm()) {
            // Hide participant section and action buttons
            const participantSection = document.getElementById('participantSection');
            const actionButtonsSection = document.getElementById('actionButtonsSection');

            if (participantSection) participantSection.style.display = 'none';
            if (actionButtonsSection) actionButtonsSection.style.display = 'none';

            // Show food stall section
            document.getElementById('foodstallSection').style.display = 'block';
            document.getElementById('nextStepSection').style.display = 'block';

            // Update button states
            const backBtn = document.getElementById('backBtn');
            if (backBtn) backBtn.style.display = 'inline-block';
        }
        return;
    }

    // Original participant form validation flow
    if (validateParticipantForm()) {
        // Hide participant section and show competitions (which should already be visible)
        const participantSection = document.getElementById('participantSection');
        const actionButtonsSection = document.getElementById('actionButtonsSection');

        if (participantSection) participantSection.style.display = 'none';
        if (actionButtonsSection) actionButtonsSection.style.display = 'none';

        // Set registration type to competition by default (since we're streamlining to competitions first)
        currentRegistrationType = 'competition';

        // Show competitions section (should already be visible from age group selection)
        document.getElementById('competitionsSection').style.display = 'block';
        document.getElementById('nextStepSection').style.display = 'block';

        // Update button states
        const continueBtn = document.getElementById('continueBtn');
        const backBtn = document.getElementById('backBtn');

        if (continueBtn) continueBtn.style.display = 'none';
        if (backBtn) backBtn.style.display = 'inline-block';
    }
}

function handleBack() {
    if (document.getElementById('foodstallSection').style.display === 'block') {
        // Go back from food stall section to food stall question
        document.getElementById('foodstallSection').style.display = 'none';
        document.getElementById('foodStallQuestionSection').style.display = 'block';
        document.getElementById('nextStepSection').style.display = 'none';
        // Hide action buttons since radio selection handles the logic
        document.getElementById('actionButtonsSection').style.display = 'none';

    } else if (document.getElementById('foodStallQuestionSection').style.display === 'block') {
        // Go back from food stall question to add another section
        document.getElementById('foodStallQuestionSection').style.display = 'none';
        document.getElementById('addAnotherSection').style.display = 'block';
        
        // Reset add another radio buttons to unchecked state
        const addAnotherYes = document.getElementById('addAnotherYes');
        const addAnotherNo = document.getElementById('addAnotherNo');
        if (addAnotherYes) addAnotherYes.checked = false;
        if (addAnotherNo) addAnotherNo.checked = false;
        
        // Hide action buttons since radio selection handles the logic
        document.getElementById('actionButtonsSection').style.display = 'none';

    } else if (document.getElementById('addAnotherSection').style.display === 'block') {
        // Go back to competitions
        document.getElementById('addAnotherSection').style.display = 'none';
        document.getElementById('competitionsSection').style.display = 'block';
        document.getElementById('nextStepSection').style.display = 'block';

        // Hide Add to Cart button
        const addToCartBtn = document.getElementById('addToCartBtn');
        if (addToCartBtn) addToCartBtn.style.display = 'none';

    } else if (document.getElementById('competitionsSection').style.display === 'block') {
        // Go back to participant info
        document.getElementById('competitionsSection').style.display = 'none';
        document.getElementById('nextStepSection').style.display = 'none';
        document.getElementById('participantSection').style.display = 'block';
        document.getElementById('actionButtonsSection').style.display = 'block';

        // Reset age group radio buttons
        const ageGroupRadios = document.querySelectorAll('input[name="ageGroup"]');
        ageGroupRadios.forEach(radio => radio.checked = false);
        updateCompetitionsDisplay(null);

        // Update button states
        const continueBtn = document.getElementById('continueBtn');
        const backBtn = document.getElementById('backBtn');
        if (continueBtn) continueBtn.style.display = 'inline-block';
        if (backBtn) backBtn.style.display = 'none';

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
        addToCart(participant);

        if (addAnotherYes) {
            // Reset only participant-specific fields and go back to participant info
            resetParticipantSpecificFields();
            showParticipantSection();
        } else if (addAnotherNo) {
            // Show food stall question instead of going directly to checkout
            document.getElementById('addAnotherSection').style.display = 'none';
            document.getElementById('foodStallQuestionSection').style.display = 'block';
            document.getElementById('actionButtonsSection').style.display = 'block';
            
            // Update button states - hide Add to Cart, show Continue
            const addToCartBtn = document.getElementById('addToCartBtn');
            const continueBtn = document.getElementById('continueBtn');
            if (addToCartBtn) addToCartBtn.style.display = 'none';
            if (continueBtn) continueBtn.style.display = 'inline-block';
        }
    }
}

function validateParticipantForm() {
    // Validate basic participant info
    const name = document.getElementById('name') ? document.getElementById('name').value.trim() : '';
    const flat = document.getElementById('flat') ? document.getElementById('flat').value.trim() : '';
    const phone = document.getElementById('phoneNumber') ? document.getElementById('phoneNumber').value.trim() : '';
    const email = document.getElementById('email') ? document.getElementById('email').value.trim() : '';
    const tower = document.getElementById('tower') ? document.getElementById('tower').value : '';
    const age = document.getElementById('age') ? document.getElementById('age').value.trim() : '';
    const ageGroup = document.querySelector('input[name="ageGroup"]:checked');
    const gender = document.querySelector('input[name="gender"]:checked');

    if (!name || !flat || !phone || !email || !tower || !age) {
        alert('Please fill in all required participant information fields.');
        return false;
    }

    if (!ageGroup) {
        alert('Please select an age group.');
        return false;
    }

    if (!gender) {
        alert('Please select a gender.');
        return false;
    }

    return true;
}

function validateFoodStallForm() {
    // Validate basic participant info
    const name = document.getElementById('name') ? document.getElementById('name').value.trim() : '';
    const flat = document.getElementById('flat') ? document.getElementById('flat').value.trim() : '';
    const phone = document.getElementById('phoneNumber') ? document.getElementById('phoneNumber').value.trim() : '';
    const email = document.getElementById('email') ? document.getElementById('email').value.trim() : '';
    const tower = document.getElementById('tower') ? document.getElementById('tower').value : '';
    const gender = document.querySelector('input[name="gender"]:checked');

    if (!name || !flat || !phone || !email || !tower) {
        alert('Please fill in all required participant information fields.');
        return false;
    }

    if (!gender) {
        alert('Please select a gender.');
        return false;
    }

    // Validate food stall specific fields
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
        age: parseInt(document.getElementById('age').value.trim()),
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

function collectFoodStallData() {
    const data = {
        name: document.getElementById('name').value.trim(),
        flat: document.getElementById('flat').value.trim(),
        phone: document.getElementById('phoneNumber').value.trim(),
        email: document.getElementById('email').value.trim(),
        tower: document.getElementById('tower').value,
        gender: document.querySelector('input[name="gender"]:checked').value,
        age: parseInt(document.getElementById('age').value.trim()),
        ageGroup: document.querySelector('input[name="ageGroup"]:checked').value,
        registrationType: 'foodstall',
        foodStalls: {
            Menu: document.getElementById('foodMenu').value.trim(),
            Dates: Array.from(document.querySelectorAll('input[id^="date-"]:checked')).map(cb => cb.value)
        },
        timestamp: new Date().toISOString()
    };

    return data;
}

function addToCart(participantData) {
    // First, deduplicate existing cart to clean up any previous duplicates
    deduplicateCart();

    // Create a unique identifier for deduplication
    let uniqueId;
    if (participantData.registrationType === 'competition') {
        uniqueId = `${participantData.name}-${participantData.email}-${JSON.stringify(participantData.competitions)}`;
    } else if (participantData.registrationType === 'foodstall') {
        uniqueId = `${participantData.name}-${participantData.email}-${JSON.stringify(participantData.foodStalls)}`;
    } else {
        // Fallback for other types
        uniqueId = `${participantData.name}-${participantData.email}-${participantData.registrationType}`;
    }

    // Check if this participant data already exists in the cart
    const existingIndex = registrationCart.findIndex(item => {
        let itemId;
        if (item.registrationType === 'competition') {
            itemId = `${item.name}-${item.email}-${JSON.stringify(item.competitions)}`;
        } else if (item.registrationType === 'foodstall') {
            itemId = `${item.name}-${item.email}-${JSON.stringify(item.foodStalls)}`;
        } else {
            itemId = `${item.name}-${item.email}-${item.registrationType}`;
        }
        return itemId === uniqueId;
    });

    // Only add if not already in cart
    if (existingIndex === -1) {
        registrationCart.push(participantData);
        saveCartToStorage();
        updateCartDisplay();
    } else {
        // Update existing entry with new timestamp
        registrationCart[existingIndex] = participantData;
        saveCartToStorage();
        updateCartDisplay();
    }
}

function deduplicateCart() {
    const seen = new Set();
    const deduplicated = [];

    for (const item of registrationCart) {
        let uniqueId;
        if (item.registrationType === 'competition') {
            uniqueId = `${item.name}-${item.email}-${JSON.stringify(item.competitions)}`;
        } else if (item.registrationType === 'foodstall') {
            uniqueId = `${item.name}-${item.email}-${JSON.stringify(item.foodStalls)}`;
        } else {
            uniqueId = `${item.name}-${item.email}-${item.registrationType}`;
        }

        if (!seen.has(uniqueId)) {
            seen.add(uniqueId);
            deduplicated.push(item);
        }
    }

    // Update cart if duplicates were found
    if (deduplicated.length !== registrationCart.length) {
        registrationCart = deduplicated;
        saveCartToStorage();
        updateCartDisplay();
    }
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
        
        // Hide submit button and register button when no participants
        const submitButtonContainer = document.getElementById('submitButtonContainer');
        if (submitButtonContainer) {
            submitButtonContainer.style.display = 'none';
        }
        
        const registerParticipantBtnCheckout = document.getElementById('registerParticipantBtnCheckout');
        if (registerParticipantBtnCheckout) {
            registerParticipantBtnCheckout.style.display = 'none';
        }
        
        return;
    }

    // Show submit button and register button when there are participants
    const submitButtonContainer = document.getElementById('submitButtonContainer');
    if (submitButtonContainer) {
        submitButtonContainer.style.display = 'block';
    }

    const registerParticipantBtnCheckout = document.getElementById('registerParticipantBtnCheckout');
    if (registerParticipantBtnCheckout) {
        registerParticipantBtnCheckout.style.display = 'inline-block';
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
            <td><i class="fas fa-times" onclick="removeFromCart(${index})" style="color: red; cursor: pointer; font-size: 18px;"></i></td>
        `;

        cartTableBody.appendChild(row);
    });

    // Update total amount in payment section
    updatePaymentTotal();
}

function calculateTotalAmount() {
    console.log('Registration cart for total calculation:', registrationCart); // Debug log
    let totalAmount = 0;
    let hasCompetitions = false;
    let foodStallDays = 0;
    let masterChefCount = 0;

    // Calculate totals
    registrationCart.forEach((participant) => {
        if (participant.registrationType === 'competition') {
            hasCompetitions = true;
            // Check for Master Chef selection in 18+ age groups
            if (participant.competitions && participant.competitions.some(comp => comp.Name === 'Master Chef')) {
                const ageGroup18Plus = ['18-35', '36-55', '56+'];
                if (ageGroup18Plus.includes(participant.ageGroup)) {
                    masterChefCount++;
                }
            }
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

    if (masterChefCount > 0) {
        totalAmount += masterChefCount * 1500; // ₹1500 per participant for Master Chef (18+)
    }

    return totalAmount;
}

function updatePaymentTotal() {
    const checkoutTotalCharge = document.getElementById('checkoutTotalCharge');
    if (!checkoutTotalCharge) return;

    const totalAmount = calculateTotalAmount();
    checkoutTotalCharge.textContent = `Total Amount to be paid: INR ${totalAmount}`;
}

function removeFromCart(index) {
    registrationCart.splice(index, 1);
    saveCartToStorage();
    updateCartDisplay();
}

function updateCheckoutStepVisibility() {
    // Hide all checkout sections
    document.getElementById('cartSection').style.display = 'none';
    document.getElementById('checkoutRulesSection').style.display = 'none';
    document.getElementById('checkoutPaymentSection').style.display = 'none';
    document.getElementById('checkoutNavigationSection').style.display = 'none';

    // Show current step
    if (currentCheckoutStep === 1) {
        document.getElementById('cartSection').style.display = 'block';
        document.getElementById('checkoutNavigationSection').style.display = 'block';
        document.getElementById('checkoutBackBtn').style.display = 'none';
        document.getElementById('checkoutNextBtn').style.display = 'inline-block';
        document.getElementById('checkoutNextBtn').innerHTML = 'Next <i class="fas fa-arrow-right"></i>';
    } else if (currentCheckoutStep === 2) {
        document.getElementById('checkoutRulesSection').style.display = 'block';
        document.getElementById('checkoutNavigationSection').style.display = 'block';
        document.getElementById('checkoutBackBtn').style.display = 'inline-block';
        document.getElementById('checkoutNextBtn').style.display = 'inline-block';
        document.getElementById('checkoutNextBtn').innerHTML = 'Continue <i class="fas fa-arrow-right"></i>';
    } else if (currentCheckoutStep === 3) {
        document.getElementById('checkoutPaymentSection').style.display = 'block';
    }
}

function handleCheckoutNext() {
    if (currentCheckoutStep === 1) {
        // Moving from Summary to Acknowledgement
        currentCheckoutStep = 2;
        updateCheckoutStepVisibility();
    } else if (currentCheckoutStep === 2) {
        // Moving from Acknowledgement to Payment
        const rulesAccepted = document.getElementById('checkoutAcknowledge') ? document.getElementById('checkoutAcknowledge').checked : false;
        if (!rulesAccepted) {
            alert('Please accept the rules and regulations.');
            return;
        }
        currentCheckoutStep = 3;
        updateCheckoutStepVisibility();
    }
}

function handleCheckoutBack() {
    if (currentCheckoutStep === 2) {
        // Moving back from Acknowledgement to Summary
        currentCheckoutStep = 1;
        updateCheckoutStepVisibility();
    } else if (currentCheckoutStep === 3) {
        // Moving back from Payment to Acknowledgement
        currentCheckoutStep = 2;
        updateCheckoutStepVisibility();
    }
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

    // Calculate total amount
    const totalAmount = calculateTotalAmount();
    console.log('Calculated total amount:', totalAmount); // Debug log

    // Collect payment proof if required
    const paymentData = {
        method: paymentMethod.value,
        proof: null,
        totalAmount: totalAmount
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
            paymentProofType: paymentProofType,
            totalAmount: paymentData.totalAmount
        };

        console.log('Submitting batch data:', batchData); // Debug log
        console.log('Total amount in batch data:', batchData.totalAmount); // Debug log

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