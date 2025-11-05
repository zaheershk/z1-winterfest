
const backendUrl = "https://script.google.com/macros/s/AKfycbwHE0hngzURiAu5ov48xzdMIxSEgar6HnEEu3PRE1arIDYBd5YK7Cm0ILjwSurwp_cV/exec";

// Global flag to control registration status
let REGISTRATION_CLOSED = true; 

// Global access code state
let hasValidAccessCode = false;
let accessCode = null; 

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

    // Check for access code in URL synchronously first
    const urlParams = new URLSearchParams(window.location.search);
    const accessCodeFromUrl = urlParams.get('access_code');
    if (accessCodeFromUrl) {
        // Temporarily assume valid and enable registration
        hasValidAccessCode = true;
        accessCode = accessCodeFromUrl;
        REGISTRATION_CLOSED = false;
    }

    // Check for access code in URL (async validation)
    checkAccessCode();

    // Initialize competitions display with no selection
    updateCompetitionsDisplay(null);

    // Navigation event listeners
    const navInformation = document.getElementById("nav-information");
    const navRegistration = document.getElementById("nav-registration");
    const navCheckout = document.getElementById("nav-checkout");
    const navDashboard = document.getElementById("nav-dashboard");
    const navAdmin = document.getElementById("nav-admin");

    if (navInformation) {
        navInformation.addEventListener("click", function () {
            switchSection("information");
        });
    }

    if (navRegistration) {
        navRegistration.addEventListener("click", function () {
            if (REGISTRATION_CLOSED && !hasValidAccessCode) {
                showRegistrationClosedMessage();
                return;
            }
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
            if (REGISTRATION_CLOSED && !hasValidAccessCode) {
                showRegistrationClosedMessage();
                return;
            }
            switchSection("checkout");
        });
    }

    if (navDashboard) {
        navDashboard.addEventListener("click", function () {
            switchSection("dashboard");
        });
    }

    if (navAdmin) {
        navAdmin.addEventListener("click", function () {
            switchSection("admin");
        });
    }

    // Information tab - Register Participant button
    const registerParticipantBtn = document.getElementById('registerParticipantBtn');
    if (registerParticipantBtn) {
        registerParticipantBtn.addEventListener('click', function () {
            if (REGISTRATION_CLOSED && !hasValidAccessCode) {
                showRegistrationClosedMessage();
                return;
            }
            switchSection('registration');
            resetRegistrationForm();
            showParticipantSection();
        });
    }

    // Checkout tab - Register Participant button
    const registerParticipantBtnCheckout = document.getElementById('registerParticipantBtnCheckout');
    if (registerParticipantBtnCheckout) {
        registerParticipantBtnCheckout.addEventListener('click', function () {
            if (REGISTRATION_CLOSED && !hasValidAccessCode) {
                showRegistrationClosedMessage();
                return;
            }

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

    // Disable registration and checkout navigation when registration is closed
    // (but allow if valid access code is present)
    if (REGISTRATION_CLOSED && !hasValidAccessCode) {
        const navRegistration = document.getElementById('nav-registration');
        const navCheckout = document.getElementById('nav-checkout');
        const registerParticipantBtn = document.getElementById('registerParticipantBtn');
        const registerParticipantBtnCheckout = document.getElementById('registerParticipantBtnCheckout');

        if (navRegistration) {
            navRegistration.style.opacity = '0.5';
            navRegistration.style.pointerEvents = 'none';
            navRegistration.title = 'Registration is closed';
        }

        if (navCheckout) {
            navCheckout.style.opacity = '0.5';
            navCheckout.style.pointerEvents = 'none';
            navCheckout.title = 'Registration is closed';
        }

        if (registerParticipantBtn) {
            registerParticipantBtn.style.opacity = '0.5';
            registerParticipantBtn.style.pointerEvents = 'none';
            registerParticipantBtn.title = 'Registration is closed';
        }

        if (registerParticipantBtnCheckout) {
            registerParticipantBtnCheckout.style.opacity = '0.5';
            registerParticipantBtnCheckout.style.pointerEvents = 'none';
            registerParticipantBtnCheckout.title = 'Registration is closed';
        }

        // Show registration closed banner
        const registrationBanner = document.querySelector('.registration-closed-banner');
        if (registrationBanner) {
            registrationBanner.style.display = 'block';
        }
    } else {
        // Hide banner when registration is open or valid access code is present
        const registrationBanner = document.querySelector('.registration-closed-banner');
        if (registrationBanner) {
            registrationBanner.style.display = 'none';
        }

        // Show special access message if using access code
        if (hasValidAccessCode) {
            showSpecialAccessMessage();
        }
    }
});

// Navigation function
function switchSection(sectionName) {
    // Prevent switching to registration or checkout sections when registration is closed
    // (unless valid access code is present)
    if (REGISTRATION_CLOSED && !hasValidAccessCode && (sectionName === 'registration' || sectionName === 'checkout')) {
        showRegistrationClosedMessage();
        return;
    }

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
    } else if (sectionName === 'registration') {
        // When coming from other sections (like dashboard), prefill if needed
        prefillRegistrationFromDashboard();
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

    // Special handling for dashboard section
    if (sectionName === 'dashboard') {
        initializeDashboard();
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
        // Coming from competitions - validate participant info and selected competitions, then go to add another
        // Ensure participant required fields are filled
        if (!validateParticipantForm()) {
            return;
        }

        const selectedCompetitions = document.querySelectorAll('input[name="competitions"]:checked');
        if (selectedCompetitions.length === 0) {
            showAlertModal('Please select at least one competition.');
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
            showAlertModal('Please select at least one date for your food stall.');
            return;
        }

        const foodMenu = document.getElementById('foodMenu').value.trim();
        if (!foodMenu) {
            showAlertModal('Please enter your food menu.');
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
            showAlertModal('Please select at least one competition.');
            return false;
        }
    } else if (currentRegistrationType === 'foodstall') {
        const selectedDates = document.querySelectorAll('input[id^="date-"]:checked');
        if (selectedDates.length === 0) {
            showAlertModal('Please select at least one date for your food stall.');
            return false;
        }

        const foodMenu = document.getElementById('foodMenu').value.trim();
        if (!foodMenu) {
            showAlertModal('Please enter your food menu.');
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
        showAlertModal('Please select an option for adding another participant.');
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
        showAlertModal('Please fill in all required participant information fields.');
        return false;
    }

    if (!ageGroup) {
        showAlertModal('Please select an age group.');
        return false;
    }

    if (!gender) {
        showAlertModal('Please select a gender.');
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
        showAlertModal('Please fill in all required participant information fields.');
        return false;
    }

    if (!gender) {
        showAlertModal('Please select a gender.');
        return false;
    }

    // Validate food stall specific fields
    const selectedDates = document.querySelectorAll('input[id^="date-"]:checked');
    if (selectedDates.length === 0) {
        showAlertModal('Please select at least one date for your food stall.');
        return false;
    }

    const foodMenu = document.getElementById('foodMenu').value.trim();
    if (!foodMenu) {
        showAlertModal('Please enter your food menu.');
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

        // Check if "None" is selected - if so, only include "None" and ignore others
        const noneSelected = Array.from(checkedCompetitions).some(cb => cb.value === 'None');
        
        checkedCompetitions.forEach(cb => {
            // If "None" is selected, only include "None". Otherwise include all selected competitions.
            if (noneSelected && cb.value !== 'None') {
                return; // Skip other competitions if "None" is selected
            }

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
            // Check if participant has real competitions (not just "None")
            const hasRealCompetitions = participant.competitions && 
                participant.competitions.length > 0 && 
                !participant.competitions.some(comp => comp.Name === 'None');
            
            if (hasRealCompetitions) {
                hasCompetitions = true;
                // Check for Master Chef selection in 18+ age groups
                if (participant.competitions.some(comp => comp.Name === 'Master Chef')) {
                    const ageGroup18Plus = ['18-35', '36-55', '56+'];
                    if (ageGroup18Plus.includes(participant.ageGroup)) {
                        masterChefCount++;
                    }
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
        // Validate that user has selected something to participate in
        const hasValidParticipation = registrationCart.some(participant => {
            // Check if participant has real competitions (not just "None")
            const hasRealCompetitions = participant.registrationType === 'competition' && 
                participant.competitions && 
                participant.competitions.length > 0 && 
                !participant.competitions.some(comp => comp.Name === 'None');
            
            // Check if participant has food stalls
            const hasFoodStalls = participant.registrationType === 'foodstall' && 
                participant.foodStalls && 
                participant.foodStalls.Dates && 
                participant.foodStalls.Dates.length > 0;
            
            return hasRealCompetitions || hasFoodStalls;
        });
        
        if (!hasValidParticipation) {
            showResetModal();
            return;
        }
        
        // Moving from Summary to Acknowledgement
        currentCheckoutStep = 2;
        updateCheckoutStepVisibility();
    } else if (currentCheckoutStep === 2) {
        // Moving from Acknowledgement to Payment
        const rulesAccepted = document.getElementById('checkoutAcknowledge') ? document.getElementById('checkoutAcknowledge').checked : false;
        if (!rulesAccepted) {
            showAlertModal('Please accept the rules and regulations.');
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
        showAlertModal('Please accept the rules and regulations.');
        return;
    }

    if (!paymentMethod) {
        showAlertModal('Please select a payment method.');
        return;
    }

    if (registrationCart.length === 0) {
        showAlertModal('Your cart is empty. Please add participants first.');
        return;
    }

    // Ensure all cart entries have required participant fields (extra guard before submission)
    const invalidEntry = registrationCart.find(p => {
        return !p.name || !p.email || !p.phone || !p.age;
    });
    if (invalidEntry) {
        showAlertModal('One or more registrations in your cart are missing required participant information (name, email, phone or age). Please review the registrations before submitting.');
        // Optionally switch user back to registration tab for correction
        switchSection('registration');
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

    // Payment proof is required for both payment options
    const proofFile = document.getElementById('checkoutPaymentConfirmation');
    if (proofFile && proofFile.files[0]) {
        paymentData.proof = proofFile.files[0];
    } else {
        showAlertModal('Please upload payment proof (screenshot) for verification.');
        return;
    }

    // Submit all registrations
    submitAllRegistrations(paymentData, rulesAccepted);
}

async function submitAllRegistrations(paymentData, rulesAccepted) {
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
            totalAmount: paymentData.totalAmount,
            acknowledgement: rulesAccepted
        };

        // Include access code if present
        if (hasValidAccessCode && window.accessCode) {
            batchData.accessCode = window.accessCode;
        }

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
                showAlertModal('Registration submitted successfully!');
            } else {
                showAlertModal(`${successCount}/${totalCount} registrations submitted successfully. Some failed - check console for details.`);
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

// Custom Alert Modal Functions
function showAlertModal(message, title = 'Alert') {
    // Create modal HTML if it doesn't exist
    let modal = document.getElementById('alertModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'alertModal';
        modal.className = 'alert-modal';
        modal.innerHTML = `
            <div class="alert-modal-content">
                <div class="alert-modal-header">
                    <h3>${title}</h3>
                    <span class="alert-modal-close" onclick="hideAlertModal()">&times;</span>
                </div>
                <div class="alert-modal-body">
                    ${message}
                </div>
                <div class="alert-modal-footer">
                    <button class="alert-modal-btn" onclick="hideAlertModal()">OK</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Add click outside to close
        modal.addEventListener('click', function(event) {
            if (event.target === modal) {
                hideAlertModal();
            }
        });
    } else {
        // Update existing modal content
        modal.querySelector('.alert-modal-header h3').textContent = title;
        modal.querySelector('.alert-modal-body').innerHTML = message;
    }

    // Add click outside to close (for both static and dynamic modals)
    modal.addEventListener('click', function(event) {
        if (event.target === modal) {
            hideAlertModal();
        }
    });

    // Show modal
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
}

function hideAlertModal() {
    const modal = document.getElementById('alertModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function showResetModal() {
    const modal = document.createElement('div');
    modal.id = 'resetModal';
    modal.className = 'alert-modal';
    modal.innerHTML = `
        <div class="alert-modal-content">
            <div class="alert-modal-header">
                <h3>Start Over</h3>
                <span class="alert-modal-close" onclick="hideResetModal()">&times;</span>
            </div>
            <div class="alert-modal-body">
                You must select at least one competition or food stall to participate in the event. Do you want to start over?
            </div>
            <div class="alert-modal-footer">
                <button class="alert-modal-btn" onclick="resetRegistrationFlow()">OK</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';

    // Add click outside to close (but don't reset)
    modal.addEventListener('click', function(event) {
        if (event.target === modal) {
            hideResetModal();
        }
    });
}

function hideResetModal() {
    const modal = document.getElementById('resetModal');
    if (modal) {
        modal.remove();
    }
}

function resetRegistrationFlow() {
    // Keep tower and flat number
    const towerValue = document.getElementById('tower').value;
    const flatValue = document.getElementById('flat').value;
    
    // Clear registration cart and state
    registrationCart = [];
    currentRegistrationType = null;
    currentCheckoutStep = 1;
    
    // Reset the form (this will clear everything)
    const form = document.getElementById('registrationForm');
    if (form) form.reset();
    
    // Restore tower and flat values
    document.getElementById('tower').value = towerValue;
    document.getElementById('flat').value = flatValue;
    
    // Reset UI state to show participant section
    document.getElementById('participantSection').style.display = 'block';
    document.getElementById('registrationTypeSection').style.display = 'none';
    document.getElementById('competitionsSection').style.display = 'none';
    document.getElementById('foodstallSection').style.display = 'none';
    document.getElementById('addAnotherSection').style.display = 'none';
    document.getElementById('foodStallQuestionSection').style.display = 'none';
    document.getElementById('actionButtonsSection').style.display = 'block';
    document.getElementById('nextStepSection').style.display = 'none';
    
    // Update cart display
    updateCartDisplay();
    updatePaymentTotal();
    
    // Navigate back to registration section
    switchSection("registration");
    
    // Hide the modal
    hideResetModal();
}

// Dashboard functionality
let dashboardApartments = [];

async function initializeDashboard() {
    // Load apartments for autocomplete
    await loadApartmentsForDashboard();

    // Setup event listeners
    setupDashboardEventListeners();

    // Clear any previous search results
    clearDashboardResults();
}

async function loadApartmentsForDashboard() {
    try {
        const response = await fetch(`${backendUrl}?apartments=true`);
        const result = await response.json();

        if (result.status === 'success') {
            dashboardApartments = result.data;

            // Setup autocomplete for apartment input
            setupApartmentAutocomplete();
        } else {
            console.error('Failed to load apartments:', result.error);
        }
    } catch (error) {
        console.error('Error loading apartments:', error);
    }
}

function setupApartmentAutocomplete() {
    const apartmentInput = document.getElementById('dashboardApartment');

    if (apartmentInput && window.jQuery) {
        $(apartmentInput).autocomplete({
            source: dashboardApartments,
            minLength: 1,
            select: function(event, ui) {
                apartmentInput.value = ui.item.value;
            }
        });
    }
}

function setupDashboardEventListeners() {
    const searchBtn = document.getElementById('dashboardSearchBtn');
    const registerBtn = document.getElementById('dashboardRegisterBtn');
    const nameInput = document.getElementById('dashboardName');
    const apartmentInput = document.getElementById('dashboardApartment');

    if (searchBtn) {
        searchBtn.addEventListener('click', performDashboardSearch);
    }

    if (registerBtn) {
        registerBtn.addEventListener('click', handleDashboardRegister);
    }

    // Allow Enter key to trigger search
    if (nameInput) {
        nameInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performDashboardSearch();
            }
        });
    }

    if (apartmentInput) {
        apartmentInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performDashboardSearch();
            }
        });
    }
}

async function performDashboardSearch() {
    const apartmentInput = document.getElementById('dashboardApartment');
    const nameInput = document.getElementById('dashboardName');

    const towerFlat = apartmentInput ? apartmentInput.value.trim() : '';
    const name = nameInput ? nameInput.value.trim() : '';

    // Validate input
    if (!towerFlat && (!name || name.length < 5)) {
        showAlertModal('Please enter either an apartment or a name (minimum 5 characters).');
        return;
    }

    // Show loading
    const searchBtn = document.getElementById('dashboardSearchBtn');
    if (searchBtn) {
        searchBtn.disabled = true;
        searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Searching...';
    }

    try {
        // Build query parameters
        const params = new URLSearchParams();
        if (towerFlat) params.append('towerFlat', towerFlat);
        if (name) params.append('name', name);

        const response = await fetch(`${backendUrl}?${params.toString()}`);
        const result = await response.json();

        if (result.status === 'success') {
            displayDashboardResults(result.data, towerFlat);
        } else {
            showAlertModal('Search failed: ' + (result.error || 'Unknown error'));
            clearDashboardResults();
        }
    } catch (error) {
        console.error('Search error:', error);
        showAlertModal('An error occurred during search. Please try again.');
        clearDashboardResults();
    } finally {
        // Hide loading
        if (searchBtn) {
            searchBtn.disabled = false;
            searchBtn.innerHTML = '<i class="fas fa-search"></i> Search';
        }
    }
}

function displayDashboardResults(data, searchTowerFlat) {
    const resultsSection = document.getElementById('dashboardResultsSection');
    const tableBody = document.getElementById('dashboardTableBody');
    const flatDisplay = document.getElementById('dashboardFlatDisplay');
    const flatNumberDisplay = document.getElementById('dashboardFlatNumberDisplay');
    const registerBtn = document.getElementById('dashboardRegisterBtn');

    if (!tableBody) return;

    tableBody.innerHTML = '';

    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="3" class="text-muted">No results found. Try adjusting your search criteria.</td></tr>';
        resultsSection.style.display = 'none';
        return;
    }

    // Show results section
    resultsSection.style.display = 'block';

    // Show flat display and register button if we have results
    if (data.length > 0) {
        if (searchTowerFlat) {
            flatNumberDisplay.textContent = searchTowerFlat;
            flatDisplay.style.display = 'block';
        } else {
            // For name searches, show apartment from first result
            const firstResult = data[0];
            if (firstResult && firstResult.tower && firstResult.flat) {
                flatNumberDisplay.textContent = `${firstResult.tower} - ${firstResult.flat}`;
                flatDisplay.style.display = 'block';
            } else {
                flatDisplay.style.display = 'none';
            }
        }
        // Only show register button if registration is not closed
        if (!REGISTRATION_CLOSED) {
            registerBtn.style.display = 'inline-block';
        }
    } else {
        flatDisplay.style.display = 'none';
        registerBtn.style.display = 'none';
    }

    // Display results
    data.forEach(registration => {
        const row = document.createElement('tr');

        let details = '';

        // Handle competitions
        if (registration.competitions && registration.competitions.trim()) {
            try {
                const comps = JSON.parse(registration.competitions);
                if (Array.isArray(comps) && comps.length > 0) {
                    const compDetails = comps.map(comp =>
                        `<div class="competition-item">
                            <strong>${comp.Name}</strong> (${comp.Category})
                            ${comp["Team Info"] !== 'N/A' ? `<br><small class="text-muted">Team: ${comp["Team Info"]}</small>` : ''}
                        </div>`
                    ).join('');
                    if (details) details += '<br>';
                    details += compDetails;
                }
            } catch (e) {
                if (details) details += '<br>';
                details += registration.competitions;
            }
        }

        // Handle food stalls
        if (registration.foodStalls && registration.foodStalls.trim()) {
            try {
                const foodData = JSON.parse(registration.foodStalls);
                if (foodData && (foodData.Menu || (foodData.Dates && foodData.Dates.length > 0))) {
                    const foodDetails = `<div class="foodstall-item">
                        ${foodData.Menu ? `<strong>Menu:</strong> ${foodData.Menu}` : ''}
                        ${foodData.Menu && foodData.Dates && foodData.Dates.length > 0 ? '<br>' : ''}
                        ${foodData.Dates && foodData.Dates.length > 0 ? `<strong>Dates:</strong> ${foodData.Dates.map(date => `<span class="badge bg-secondary">${date}</span>`).join(' ')}` : ''}
                    </div>`;
                    if (details) details += '<br>';
                    details += foodDetails;
                }
            } catch (e) {
                if (details) details += '<br>';
                details += registration.foodStalls;
            }
        }

        // If no details found, show a placeholder
        if (!details) {
            details = '<em class="text-muted">No details available</em>';
        }

        const regDate = new Date(registration.registrationDate).toLocaleDateString();

        // Only show EDIT button for competition registrations and when registration is not closed
        const showEditButton = registration.registrationType === 'competition' && !REGISTRATION_CLOSED;

        row.innerHTML = `
            <td>${registration.name}</td>
            <td>${registration.ageGroup}</td>
            <td>${details}</td>
            <td>
                ${showEditButton ? `<button class="btn btn-outline-primary" style="font-size: 0.75rem; padding: 0.2rem 0.5rem;" onclick="openEditModal('${registration.uniqueRecordId}', '${registration.name.replace(/'/g, "\\'")}', '${registration.ageGroup}', '${registration.competitions.replace(/'/g, "\\'").replace(/"/g, '&quot;')}')">
                    <i class="fas fa-edit"></i> Edit
                </button>` : ''}
            </td>
        `;

        tableBody.appendChild(row);
    });
}

function clearDashboardResults() {
    const resultsSection = document.getElementById('dashboardResultsSection');
    const tableBody = document.getElementById('dashboardTableBody');
    const flatDisplay = document.getElementById('dashboardFlatDisplay');
    const registerBtn = document.getElementById('dashboardRegisterBtn');

    if (resultsSection) resultsSection.style.display = 'none';
    if (tableBody) tableBody.innerHTML = '<tr><td colspan="4" class="text-muted">No results found. Try adjusting your search criteria.</td></tr>';
    if (flatDisplay) flatDisplay.style.display = 'none';
    if (registerBtn) registerBtn.style.display = 'none';
}

function handleDashboardRegister() {
    if (REGISTRATION_CLOSED) {
        showRegistrationClosedMessage();
        return;
    }

    // Try to get apartment from the input field first (apartment search)
    const apartmentInput = document.getElementById('dashboardApartment');
    let tower = null;
    let flat = null;

    if (apartmentInput && apartmentInput.value.trim()) {
        [tower, flat] = apartmentInput.value.split(' - ');
    } else {
        // For name searches, get from the displayed flat info
        const flatNumberDisplay = document.getElementById('dashboardFlatNumberDisplay');
        if (flatNumberDisplay && flatNumberDisplay.textContent) {
            [tower, flat] = flatNumberDisplay.textContent.split(' - ');
        }
    }

    if (!tower || !flat) {
        showAlertModal('No apartment information available for registration.');
        return;
    }

    // Store the tower and flat for pre-filling
    sessionStorage.setItem('dashboardTower', tower);
    sessionStorage.setItem('dashboardFlat', flat);

    // Switch to registration section
    switchSection('registration');
}

// Function to pre-fill registration form from dashboard
function prefillRegistrationFromDashboard() {
    const tower = sessionStorage.getItem('dashboardTower');
    const flat = sessionStorage.getItem('dashboardFlat');

    if (tower && flat) {
        const towerField = document.getElementById('tower');
        const flatField = document.getElementById('flat');

        if (towerField) {
            towerField.value = tower;
            towerField.disabled = true; // Lock the field
        }

        if (flatField) {
            flatField.value = flat;
            flatField.disabled = true; // Lock the field
        }

        // Clear the session storage
        sessionStorage.removeItem('dashboardTower');
        sessionStorage.removeItem('dashboardFlat');
    }
}

// Edit Modal Functions
let currentEditData = null;

function openEditModal(uniqueRecordId, participantName, ageGroup, competitionsJson) {
    if (REGISTRATION_CLOSED) {
        showRegistrationClosedMessage();
        return;
    }

    currentEditData = {
        uniqueRecordId: uniqueRecordId,
        participantName: participantName,
        ageGroup: ageGroup,
        originalCompetitions: competitionsJson
    };

    // Set participant info
    document.getElementById('editParticipantName').textContent = participantName;
    document.getElementById('editAgeGroup').textContent = ageGroup;

    // Populate competitions based on age group
    populateEditCompetitions(ageGroup, competitionsJson);

    // Show modal
    const editModal = new bootstrap.Modal(document.getElementById('editModal'));
    editModal.show();
}

function populateEditCompetitions(ageGroup, competitionsJson) {
    const container = document.getElementById('editCompetitionsContainer');
    if (!container) return;

    // Parse existing competitions
    let existingCompetitions = [];
    try {
        existingCompetitions = JSON.parse(competitionsJson) || [];
    } catch (e) {
        existingCompetitions = [];
    }

    // Create competitions HTML similar to registration but filtered by age group
    let html = '<div class="section-header"><h5>Select Competitions</h5></div>';

    competitionsData.forEach(category => {
        // Check if this category has competitions for the participant's age group
        const hasCompetitionsForAgeGroup = category.competitions.some(comp => {
            return comp.ageGroups && comp.ageGroups.includes(ageGroup);
        });

        if (hasCompetitionsForAgeGroup) {
            html += `<div class="mb-3">
                <h6 class="text-primary">${category.category}</h6>`;

            category.competitions.forEach(comp => {
                if (comp.ageGroups && comp.ageGroups.includes(ageGroup)) {
                    // Check if this competition was previously selected
                    const existingComp = existingCompetitions.find(ec => ec.Name === comp.name);
                    const isChecked = existingComp ? 'checked' : '';
                    const teamInfo = existingComp && existingComp["Team Info"] && existingComp["Team Info"] !== 'N/A' ? existingComp["Team Info"] : '';
                    const showTeamInfo = isChecked && comp.teamBased;

                    html += `
                        <div class="form-check">
                            <input class="form-check-input edit-competition-checkbox" type="checkbox"
                                   id="edit-${comp.name.replace(/\s+/g, '-')}" value="${comp.name}" ${isChecked}>
                            <label class="form-check-label" for="edit-${comp.name.replace(/\s+/g, '-')}" data-team-based="${comp.teamBased}">
                                ${comp.name}
                            </label>
                        </div>`;
                    
                    if (comp.teamBased) {
                        html += `
                        <div class="mb-2 ms-4 edit-team-info" id="edit-team-${comp.name.replace(/\s+/g, '-')}" style="display: ${showTeamInfo ? 'block' : 'none'}">
                            <input type="text" class="form-control form-control-sm"
                                   placeholder="Team name (if applicable)" value="${teamInfo}">
                        </div>`;
                    }
                }
            });

            html += '</div>';
        }
    });

    container.innerHTML = html;

    // Add event listeners for team info visibility
    document.querySelectorAll('.edit-competition-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const teamDiv = document.getElementById('edit-team-' + this.id.replace('edit-', ''));
            if (teamDiv) {
                teamDiv.style.display = this.checked ? 'block' : 'none';
            }
        });
    });

    // Add event listeners for team info toggling
    document.querySelectorAll('.edit-competition-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const teamDiv = document.getElementById('edit-team-' + this.id.replace('edit-', ''));
            const label = this.nextElementSibling;
            const isTeamBased = label && label.getAttribute('data-team-based') === 'true';
            if (teamDiv && isTeamBased) {
                teamDiv.style.display = this.checked ? 'block' : 'none';
                if (!this.checked) {
                    // Clear the input when unchecked
                    const input = teamDiv.querySelector('input');
                    if (input) input.value = '';
                }
            }
        });
    });
}

function saveEditCompetitions() {
    if (!currentEditData) return;

    // Collect selected competitions
    const selectedCompetitions = [];
    const checkedBoxes = document.querySelectorAll('.edit-competition-checkbox:checked');
    
    // Check if "None" is selected - if so, only include "None" and ignore others
    const noneSelected = Array.from(checkedBoxes).some(cb => cb.value === 'None');
    
    checkedBoxes.forEach(checkbox => {
        const compName = checkbox.value;
        
        // If "None" is selected, only include "None". Otherwise include all selected competitions.
        if (noneSelected && compName !== 'None') {
            return; // Skip other competitions if "None" is selected
        }

        const teamInput = document.querySelector(`[id="edit-team-${checkbox.id.replace('edit-', '')}"] input`);
        const teamInfo = teamInput && teamInput.value ? teamInput.value.trim() : 'N/A';

        // Find the category for this competition
        let category = '';
        competitionsData.forEach(cat => {
            const comp = cat.competitions.find(c => c.name === compName);
            if (comp) {
                category = cat.category;
            }
        });

        selectedCompetitions.push({
            Category: category,
            Name: compName,
            "Team Info": teamInfo
        });
    });

    // console.log('selectedCompetitions:', selectedCompetitions);

    // Prepare update data
    const updateData = {
        updateParticipant: {
            uniqueRecordId: currentEditData.uniqueRecordId,
            competitions: selectedCompetitions
        }
    };

    // console.log('updateData being sent:', updateData);

    // Show loading state
    const saveBtn = document.getElementById('saveEditBtn');
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    }

    // Send update request
    fetch(backendUrl, {
        method: 'POST',
        mode: "cors",
        cache: "no-cache",
        headers: {
            "Content-Type": "text/plain",
        },
        redirect: "follow",
        body: JSON.stringify(updateData)
    })
    .then(response => response.json())
    .then(result => {
        if (result.status === 'success') {
            showAlertModal('Competitions updated successfully!');
            // Close modal
            const editModal = bootstrap.Modal.getInstance(document.getElementById('editModal'));
            if (editModal) editModal.hide();
            // Refresh dashboard if we're on dashboard tab
            if (document.getElementById('dashboard-section').classList.contains('active')) {
                // Re-run the last search to refresh results
                performDashboardSearch();
            }
        } else {
            showAlertModal('Failed to update competitions: ' + (result.error || 'Unknown error'));
        }
    })
    .catch(error => {
        console.error('Update error:', error);
        showAlertModal('An error occurred while updating. Please try again.');
    })
    .finally(() => {
        // Reset button state
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="fas fa-save"></i> Save';
        }
    });
}

// Add event listener for save button
document.addEventListener('DOMContentLoaded', function() {
    const saveEditBtn = document.getElementById('saveEditBtn');
    if (saveEditBtn) {
        saveEditBtn.addEventListener('click', saveEditCompetitions);
    }
});

// Function to show registration closed message
function showRegistrationClosedMessage() {
    const modalHtml = `
        <div class="modal fade" id="registrationClosedModal" tabindex="-1" aria-labelledby="registrationClosedModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="registrationClosedModalLabel">
                            <i class="fas fa-info-circle text-info"></i> Registration Closed
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body text-center">
                        <div class="mb-3">
                            <i class="fas fa-calendar-times fa-3x text-warning mb-3"></i>
                        </div>
                        <h6 class="fw-bold">Z1 Winterfest 2025 Registration is Now Closed</h6>
                        <p class="text-muted mb-3">
                            Thank you for your interest! Our enrollment window has ended.
                        </p>
                        <p class="mb-0">
                            You can still view your existing registrations using the <strong>Dashboard</strong> tab.
                        </p>
                    </div>
                    <div class="modal-footer justify-content-center">
                        <button type="button" class="btn btn-primary" data-bs-dismiss="modal">
                            <i class="fas fa-check"></i> OK
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal if present
    const existingModal = document.getElementById('registrationClosedModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('registrationClosedModal'));
    modal.show();

    // Clean up modal after it's hidden
    document.getElementById('registrationClosedModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

// ---- ACCESS CODE FUNCTIONS ----

// Function to check for access code in URL and validate it
function checkAccessCode() {
    const urlParams = new URLSearchParams(window.location.search);
    const accessCode = urlParams.get('access_code');

    if (!accessCode) {
        return; // No access code in URL
    }

    // Validate the access code with backend
    $.getJSON(backendUrl + '?validate_access_code=' + encodeURIComponent(accessCode), function(response) {
        if (response.valid) {
            hasValidAccessCode = true;
            window.accessCode = accessCode;
            REGISTRATION_CLOSED = false; // Override for this session
            console.log('Valid access code detected:', accessCode, '- Registration reopened for this session');
            
            // Re-enable the UI since registration is now open
            const navRegistration = document.getElementById('nav-registration');
            const navCheckout = document.getElementById('nav-checkout');
            const registerParticipantBtn = document.getElementById('registerParticipantBtn');
            const registerParticipantBtnCheckout = document.getElementById('registerParticipantBtnCheckout');

            if (navRegistration) {
                navRegistration.style.opacity = '1';
                navRegistration.style.pointerEvents = 'auto';
                navRegistration.title = '';
            }

            if (navCheckout) {
                navCheckout.style.opacity = '1';
                navCheckout.style.pointerEvents = 'auto';
                navCheckout.title = '';
            }

            if (registerParticipantBtn) {
                registerParticipantBtn.style.opacity = '1';
                registerParticipantBtn.style.pointerEvents = 'auto';
                registerParticipantBtn.title = '';
            }

            if (registerParticipantBtnCheckout) {
                registerParticipantBtnCheckout.style.opacity = '1';
                registerParticipantBtnCheckout.style.pointerEvents = 'auto';
                registerParticipantBtnCheckout.title = '';
            }

            // Hide registration closed banner
            const registrationBanner = document.querySelector('.registration-closed-banner');
            if (registrationBanner) {
                registrationBanner.style.display = 'none';
            }

            showSpecialAccessMessage();
        } else {
            // Invalid access code - revert to closed state
            hasValidAccessCode = false;
            accessCode = null;
            REGISTRATION_CLOSED = true;
            console.log('Invalid access code:', accessCode, 'Reason:', response.reason);
            
            // Disable the UI
            const navRegistration = document.getElementById('nav-registration');
            const navCheckout = document.getElementById('nav-checkout');
            const registerParticipantBtn = document.getElementById('registerParticipantBtn');
            const registerParticipantBtnCheckout = document.getElementById('registerParticipantBtnCheckout');

            if (navRegistration) {
                navRegistration.style.opacity = '0.5';
                navRegistration.style.pointerEvents = 'none';
                navRegistration.title = 'Registration is closed';
            }

            if (navCheckout) {
                navCheckout.style.opacity = '0.5';
                navCheckout.style.pointerEvents = 'none';
                navCheckout.title = 'Registration is closed';
            }

            if (registerParticipantBtn) {
                registerParticipantBtn.style.opacity = '0.5';
                registerParticipantBtn.style.pointerEvents = 'none';
                registerParticipantBtn.title = 'Registration is closed';
            }

            if (registerParticipantBtnCheckout) {
                registerParticipantBtnCheckout.style.opacity = '0.5';
                registerParticipantBtnCheckout.style.pointerEvents = 'none';
                registerParticipantBtnCheckout.title = 'Registration is closed';
            }

            // Show registration closed banner
            const registrationBanner = document.querySelector('.registration-closed-banner');
            if (registrationBanner) {
                registrationBanner.style.display = 'block';
            }

            showAlertModal('Invalid or expired access code. Registration access denied.');
        }
    }).fail(function() {
        // Error validating - revert to closed state
        hasValidAccessCode = false;
        accessCode = null;
        REGISTRATION_CLOSED = true;
        console.log('Error validating access code');
        
        // Disable the UI
        const navRegistration = document.getElementById('nav-registration');
        const navCheckout = document.getElementById('nav-checkout');
        const registerParticipantBtn = document.getElementById('registerParticipantBtn');
        const registerParticipantBtnCheckout = document.getElementById('registerParticipantBtnCheckout');

        if (navRegistration) {
            navRegistration.style.opacity = '0.5';
            navRegistration.style.pointerEvents = 'none';
            navRegistration.title = 'Registration is closed';
        }

        if (navCheckout) {
            navCheckout.style.opacity = '0.5';
            navCheckout.style.pointerEvents = 'none';
            navCheckout.title = 'Registration is closed';
        }

        if (registerParticipantBtn) {
            registerParticipantBtn.style.opacity = '0.5';
            registerParticipantBtn.style.pointerEvents = 'none';
            registerParticipantBtn.title = 'Registration is closed';
        }

        if (registerParticipantBtnCheckout) {
            registerParticipantBtnCheckout.style.opacity = '0.5';
            registerParticipantBtnCheckout.style.pointerEvents = 'none';
            registerParticipantBtnCheckout.title = 'Registration is closed';
        }

        // Show registration closed banner
        const registrationBanner = document.querySelector('.registration-closed-banner');
        if (registrationBanner) {
            registrationBanner.style.display = 'block';
        }

        showAlertModal('Error validating access code. Please try again.');
    });
}

// Function to show special access message when using access code
function showSpecialAccessMessage() {
    // Check if banner already exists to prevent duplicates
    if (document.querySelector('.special-access-banner')) {
        return;
    }

    const banner = document.createElement('div');
    banner.className = 'alert alert-success text-center special-access-banner';
    banner.style.backgroundColor = '#d4edda';
    banner.style.borderColor = '#c3e6cb';
    banner.style.color = '#155724';
    banner.style.marginBottom = '20px';
    banner.innerHTML = `
        <i class="fas fa-key"></i> <strong>Temporary Access Granted!</strong><br>
        You have been granted temporary access to register for Winterfest 2025.
    `;

    // Insert at the top of the main content area
    const mainContent = document.querySelector('.container');
    if (mainContent && mainContent.firstChild) {
        mainContent.insertBefore(banner, mainContent.firstChild);
    }
}