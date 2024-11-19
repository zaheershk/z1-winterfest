const backendUrl = "https://script.google.com/macros/s/AKfycbzcO4QzvrtHjfVgVknog5A59eO6A7RJOYMfwQJJJJ_9JY77_mla2Qn4pYGqDg2mlUZ32Q/exec";

const competitionsData = [
    {
        category: "Cultural",
        competitions: [
            { name: "Dance", ageGroups: ["3to5yrs"], teamBased: false, displayAgeGroups: "", numberOfWinners: 1 },
            { name: "Dance-Bollywood", ageGroups: ["6to10yrs", "11to16yrs", "17to29yrs", "30to35yrs", "36to49yrs", "50to55yrs", "56Yrsabove"], teamBased: false, displayAgeGroups: "", numberOfWinners: 1 },
            { name: "Dance-Classical", ageGroups: ["6to10yrs", "11to16yrs", "17to29yrs", "30to35yrs", "36to49yrs", "50to55yrs", "56Yrsabove"], teamBased: false, displayAgeGroups: "", numberOfWinners: 1 },
            { name: "DJ Night", ageGroups: ["6to10yrs", "11to16yrs", "17to29yrs", "30to35yrs", "36to49yrs", "50to55yrs", "56Yrsabove"], teamBased: false, displayAgeGroups: "", numberOfWinners: 0 },
            { name: "Drawing", ageGroups: ["3to5yrs", "6to10yrs", "11to16yrs"], teamBased: false, displayAgeGroups: "", numberOfWinners: 1 },
            { name: "Fancy Dress", ageGroups: ["3to5yrs", "6to10yrs", "11to16yrs"], teamBased: false, displayAgeGroups: "", numberOfWinners: 1 },
            { name: "Karaoke Night", ageGroups: ["6to10yrs", "11to16yrs", "17to29yrs", "30to35yrs", "36to49yrs", "50to55yrs", "56Yrsabove"], teamBased: false, displayAgeGroups: "", numberOfWinners: 0 },
            { name: "Master Chef (Cooking without fire)", ageGroups: ["11to16yrs"], teamBased: false, displayAgeGroups: "", numberOfWinners: 1 },
            { name: "Master Chef", ageGroups: ["17to29yrs", "30to35yrs", "36to49yrs", "50to55yrs", "56Yrsabove"], teamBased: false, displayAgeGroups: "", numberOfWinners: 1 },
            { name: "Musical Instrument", ageGroups: ["3to5yrs", "6to10yrs", "11to16yrs", "17to29yrs", "30to35yrs", "36to49yrs", "50to55yrs", "56Yrsabove"], teamBased: false, displayAgeGroups: "", numberOfWinners: 1 },
            { name: "Rangoli", ageGroups: ["11to16yrs", "17to29yrs", "30to35yrs", "36to49yrs", "50to55yrs", "56Yrsabove"], teamBased: false, displayAgeGroups: "", numberOfWinners: 1 },
            { name: "Singing", ageGroups: ["3to5yrs"], teamBased: false, displayAgeGroups: "", numberOfWinners: 1 },
            { name: "Singing-Bollywood", ageGroups: ["6to10yrs", "11to16yrs", "17to29yrs", "30to35yrs", "36to49yrs", "50to55yrs", "56Yrsabove"], teamBased: false, displayAgeGroups: "", numberOfWinners: 1 },
            { name: "Singing-Classical", ageGroups: ["6to10yrs", "11to16yrs", "17to29yrs", "30to35yrs", "36to49yrs", "50to55yrs", "56Yrsabove"], teamBased: false, displayAgeGroups: "", numberOfWinners: 1 },
        ],
    },
    {
        category: "Games",
        competitions: [
            { name: "Build an Object (Teams of 3)", ageGroups: ["6to10yrs", "11to16yrs", "17to29yrs", "30to35yrs", "36to49yrs", "50to55yrs", "56Yrsabove"], teamBased: true, displayAgeGroups: "6-10, 11-16, 17-35, 36-55, 56 & above", numberOfWinners: 3 },
            { name: "Jump In & Out", ageGroups: ["6to10yrs", "11to16yrs", "17to29yrs", "30to35yrs", "36to49yrs", "50to55yrs", "56Yrsabove"], teamBased: false, displayAgeGroups: "", numberOfWinners: 1 },
            { name: "Lemon & Spoon Race", ageGroups: ["3to5yrs", "6to10yrs", "11to16yrs", "17to29yrs", "30to35yrs", "36to49yrs", "50to55yrs", "56Yrsabove"], teamBased: false, displayAgeGroups: "", numberOfWinners: 1 },
            { name: "Musical Chairs", ageGroups: ["3to5yrs", "6to10yrs", "11to16yrs", "17to29yrs", "30to35yrs", "36to49yrs", "50to55yrs", "56Yrsabove"], teamBased: false, displayAgeGroups: "", numberOfWinners: 1 },
            { name: "Potato Picking Race", ageGroups: ["6to10yrs", "11to16yrs", "17to29yrs", "30to35yrs", "36to49yrs", "50to55yrs", "56Yrsabove"], teamBased: false, displayAgeGroups: "", numberOfWinners: 1 },
            { name: "Price is Right (Teams of 3)", ageGroups: ["6to10yrs", "11to16yrs", "17to29yrs", "30to35yrs", "36to49yrs", "50to55yrs", "56Yrsabove"], teamBased: true, displayAgeGroups: "6-10, 11-16, 17-35, 36-55, 56 & above", numberOfWinners: 3 },
            { name: "Sack Race", ageGroups: ["6to10yrs", "11to16yrs", "17to29yrs", "30to35yrs", "36to49yrs", "50to55yrs", "56Yrsabove"], teamBased: false, displayAgeGroups: "", numberOfWinners: 1 },
            { name: "Slow cycling", ageGroups: ["6to10yrs", "11to16yrs", "17to29yrs", "30to35yrs", "36to49yrs", "50to55yrs", "56Yrsabove"], teamBased: false, displayAgeGroups: "", numberOfWinners: 1 },
            { name: "Tambola", ageGroups: ["6to10yrs", "11to16yrs", "17to29yrs", "30to35yrs", "36to49yrs", "50to55yrs", "56Yrsabove"], teamBased: false, displayAgeGroups: "", numberOfWinners: 1 },
            { name: "Treasure Hunt (Teams of 4)", ageGroups: ["6to10yrs", "11to16yrs", "17to29yrs", "30to35yrs", "36to49yrs", "50to55yrs", "56Yrsabove"], teamBased: true, displayAgeGroups: "6-10, 11-16, 17-35, 36-55, 56 & above", numberOfWinners: 4 },
            { name: "Tug of War (Teams of 6)", ageGroups: ["6to10yrs", "11to16yrs", "17to29yrs", "30to35yrs", "36to49yrs", "50to55yrs", "56Yrsabove"], teamBased: true, displayAgeGroups: "Up to 16, 17 & above", numberOfWinners: 6 },
        ],
    },
    {
        category: "Quiz",
        competitions: [
            { name: "Bollywood Quiz (Teams of 3)", ageGroups: ["6to10yrs", "11to16yrs", "17to29yrs", "30to35yrs", "36to49yrs", "50to55yrs", "56Yrsabove"], teamBased: true, displayAgeGroups: "No age category specification", numberOfWinners: 3 },
            { name: "General Knowledge Quiz (Teams of 3)", ageGroups: ["6to10yrs", "11to16yrs", "17to29yrs", "30to35yrs", "36to49yrs", "50to55yrs", "56Yrsabove"], teamBased: true, displayAgeGroups: "No age category specification", numberOfWinners: 3 },
            { name: "Spelling Bee", ageGroups: ["6to10yrs", "11to16yrs"], teamBased: false, numberOfWinners: 1 },
        ],
    },
    {
        category: "Sports",
        competitions: [
            { name: "8 Ball Pool", ageGroups: ["17to29yrs", "30to35yrs", "36to49yrs", "50to55yrs", "56Yrsabove"], teamBased: false, displayAgeGroups: "", numberOfWinners: 1 },
            { name: "Badminton (Singles)", ageGroups: ["6to10yrs", "11to16yrs"], teamBased: false, displayAgeGroups: "", numberOfWinners: 1 },
            { name: "Badminton (Doubles)", ageGroups: ["17to29yrs", "30to35yrs", "36to49yrs", "50to55yrs", "56Yrsabove"], teamBased: true, displayAgeGroups: "17-29, 30-49, 50 & above", numberOfWinners: 2 },
            { name: "Badminton (Mixed Doubles)", ageGroups: ["17to29yrs", "30to35yrs", "36to49yrs", "50to55yrs", "56Yrsabove"], teamBased: true, displayAgeGroups: "17-29, 30-49, 50 & above", numberOfWinners: 2 },
            { name: "Table Tennis (Singles)", ageGroups: ["6to10yrs", "11to16yrs"], teamBased: false, displayAgeGroups: "", numberOfWinners: 1 },
            { name: "Table Tennis (Doubles)", ageGroups: ["17to29yrs", "30to35yrs", "36to49yrs", "50to55yrs", "56Yrsabove"], teamBased: true, displayAgeGroups: "17-29, 30-49, 50 & above", numberOfWinners: 2 },
            { name: "Table Tennis (Mixed Doubles)", ageGroups: ["17to29yrs", "30to35yrs", "36to49yrs", "50to55yrs", "56Yrsabove"], teamBased: true, displayAgeGroups: "17-29, 30-49, 50 & above", numberOfWinners: 2 },
            { name: "Lawn Tennis (Singles)", ageGroups: ["6to10yrs", "11to16yrs"], teamBased: false, displayAgeGroups: "", numberOfWinners: 1 },
            { name: "Lawn Tennis (Doubles)", ageGroups: ["17to29yrs", "30to35yrs", "36to49yrs", "50to55yrs", "56Yrsabove"], teamBased: true, displayAgeGroups: "17-29, 30-49, 50 & above", numberOfWinners: 2 },
            { name: "Lawn Tennis (Mixed Doubles)", ageGroups: ["17to29yrs", "30to35yrs", "36to49yrs", "50to55yrs", "56Yrsabove"], teamBased: true, displayAgeGroups: "17-29, 30-49, 50 & above", numberOfWinners: 2 },
            { name: "Cards-29 (Doubles)", ageGroups: ["17to29yrs", "30to35yrs", "36to49yrs", "50to55yrs", "56Yrsabove"], teamBased: true, displayAgeGroups: "18 & above", numberOfWinners: 2 },
            { name: "Carrom (Doubles)", ageGroups: ["6to10yrs", "11to16yrs", "17to29yrs", "30to35yrs", "36to49yrs", "50to55yrs", "56Yrsabove"], teamBased: true, displayAgeGroups: "6-10, 11-16, 17-29, 30-49, 50 & above", numberOfWinners: 2 },
            { name: "Chess", ageGroups: ["6to10yrs", "11to16yrs", "17to29yrs", "30to35yrs", "36to49yrs", "50to55yrs", "56Yrsabove"], teamBased: false, displayAgeGroups: "", numberOfWinners: 1 },
            { name: "Kabaddi (Teams of 9)", ageGroups: ["6to10yrs", "11to16yrs", "17to29yrs", "30to35yrs", "36to49yrs", "50to55yrs", "56Yrsabove"], teamBased: true, displayAgeGroups: "Up to 16, 17 & above", numberOfWinners: 9 },
            { name: "Swimming", ageGroups: ["3to5yrs", "6to10yrs", "11to16yrs", "17to29yrs", "30to35yrs", "36to49yrs", "50to55yrs", "56Yrsabove"], teamBased: false, displayAgeGroups: "", numberOfWinners: 1 },
        ],
    },
];

var paymentScreenshotBytes = null;
var paymentScreenshotMimeType = null;
var reportTabClicked = null;

const foodStallCheckboxSelector = "#date-10nov, #date-16nov, #date-17nov, #date-23nov, #date-24nov, #date-30nov, #date-1dec, #date-7dec, #date-8dec";

document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("registrationForm");
    const submitBtn = document.getElementById("submitBtn");

    const successModal = document.getElementById("successModal");
    const successModalCloseBtn = document.getElementsByClassName("close")[0];
    const newRegBtn = document.getElementById("newRegistrationBtn");

    const errorModal = document.getElementById("errorModal");
    const errorModalCloseBtn = document.getElementsByClassName("close")[1];
    const retryRegBtn = document.getElementById("retryRegistrationBtn");

    var loginModal = document.getElementById("loginModal");
    var loginBtn = document.getElementById("loginButton");

    var planningReportTab = document.getElementById("planningReportTab");
    var paymentReportTab = document.getElementById("paymentReportTab");

    var registrationTab = document.getElementById("registrationTab");
    const registrationsClosedModal = document.getElementById("registrationClosedModal");
    const dashboardBtn = document.getElementById("dashboardButton");

    /* var winnersFormTab = document.getElementById("winnersFormTab");
    winnersFormSubmitBtn = document.getElementById("winnersFormSubmitBtn"); */

    updateCompetitionsDisplay("3to5yrs"); // Default age group on load

    document.querySelectorAll(foodStallCheckboxSelector).forEach((checkbox) => {
        checkbox.addEventListener("change", function () {
            updateTotalAmountDisplay();
        });
    });

    document.getElementById("option1").addEventListener("change", function () {
        updateTotalAmountDisplay();
    });

    document.getElementById("option2").addEventListener("change", function () {
        updateTotalAmountDisplay();
    });

    document.getElementById("paymentConfirmation").addEventListener("change", function (event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (loadEvent) {
                paymentScreenshotBytes = loadEvent.target.result;
                paymentScreenshotMimeType = file.type;
            };
            reader.readAsDataURL(file);
        } else {
            // Reset to null if the file input is cleared
            paymentScreenshotBytes = null;
            paymentScreenshotMimeType = null;
        }
    });

    submitBtn.addEventListener("click", function (event) {
        event.preventDefault(); // Prevent form from submitting traditionally
        document.getElementById("loadingSpinner").hidden = false; // Show spinner

        // Step 1: Validate the data
        let formValid = true;
        const invalidInputClass = "is-invalid"; // Bootstrap 5 class for invalid input

        // Reset invalid inputs
        document.querySelectorAll(`.${invalidInputClass}`).forEach((el) => el.classList.remove(invalidInputClass));

        // Collect inputs and checks
        const v_email = document.getElementById("email");
        const v_name = document.getElementById("name");
        const v_phoneNumber = document.getElementById("phoneNumber");
        const v_tower = document.getElementById("tower");
        const v_flat = document.getElementById("flat");
        const v_gender = document.querySelector('input[name="gender"]:checked');
        const v_age = document.getElementById("age");
        const v_ageGroup = document.querySelector('input[name="ageGroup"]:checked');
        //const v_competitions = document.querySelectorAll('input[name="competitions"]:checked');
        const v_acknowledge = document.getElementById("acknowledge").checked;
        const v_paymentOption = document.querySelector('input[name="paymentOption"]:checked');
        const v_paymentConfirmation = document.getElementById("paymentConfirmation");

        // Mandatory checks
        [v_email, v_name, v_phoneNumber, v_tower, v_flat, v_age].forEach((input) => {
            // Check if the element exists and has an empty value
            if (input && !input.value) {
                input.classList.add(invalidInputClass);
                formValid = false;
            } else if (!input) {
                console.warn(`Element ${input} is not found in the document.`);
            }
        });

        if (!v_gender) {
            document.querySelectorAll('input[name="gender"]').forEach((input) => input.classList.add(invalidInputClass));
            formValid = false;
        }

        if (!v_ageGroup) {
            document.querySelectorAll('input[name="ageGroup"]').forEach((input) => input.classList.add(invalidInputClass));
            formValid = false;
        }

        if (!v_acknowledge) {
            document.getElementById("acknowledge").classList.add(invalidInputClass);
            formValid = false;
        }

        if (!v_paymentOption) {
            document.querySelectorAll('input[name="paymentOption"]').forEach((input) => input.classList.add(invalidInputClass));
            formValid = false;
        }

        //console.log(`File input length: ${v_paymentConfirmation.files.length}`);
        if (v_paymentConfirmation.files && v_paymentConfirmation.files.length === 0) {
            v_paymentConfirmation.classList.add(invalidInputClass);
            formValid = false;
        }

        const selectedCompetitions = document.querySelectorAll('input[name="competitions"]:checked');
        selectedCompetitions.forEach((comp) => {
            const v_compId = comp.id;
            if (document.getElementById(`team-${v_compId}`) && document.getElementById(`team-${v_compId}`).value === "") {
                formValid = false;
                v_teamInfo = document.getElementById(`team-${v_compId}`);
                v_teamInfo.classList.add(invalidInputClass);
            }
        });

        if (!formValid) {
            alert("Please review & fill in all required fields.");
            document.getElementById("loadingSpinner").hidden = true;
            return false;
        }

        // Step 2: Set the data
        var email = document.getElementById("email").value;
        var name = document.getElementById("name").value;
        var phoneNumber = document.getElementById("phoneNumber").value;
        var tower = document.getElementById("tower").value;
        var flat = document.getElementById("flat").value;
        var gender = document.querySelector('input[name="gender"]:checked');
        var age = document.getElementById("age").value;
        var ageGroup = document.querySelector('input[name="ageGroup"]:checked');

        let competitionInfo = [];
        selectedCompetitions.forEach((comp) => {
            const compId = comp.id;

            // Reset teamInfo to null at the start of each loop
            let teamInfo = null;

            if (document.getElementById(`team-${compId}`)) {
                let teamInfoInput = document.getElementById(`team-${compId}`);
                if (teamInfoInput && teamInfoInput.value) {
                    teamInfo = teamInfoInput.value;
                }
            }

            const category = comp.closest(".category-block").querySelector(".category-header").textContent;
            competitionInfo.push({
                category: category,
                name: comp.labels[0].innerText,
                teamInfo: teamInfo,
            });
        });

        const foodMenu = document.getElementById("foodMenu").value;
        const selectedDates = [];
        document.querySelectorAll('.form-check-input[type="checkbox"]').forEach((checkbox) => {
            if (checkbox.checked) {
                selectedDates.push(checkbox.value);
            }
        });
        const foodStallInfo = {
            menu: foodMenu,
            dates: selectedDates,
        };

        var acknowledge = document.getElementById("acknowledge").checked ? "Yes" : "No";
        var paymentOption = document.querySelector('input[name="paymentOption"]:checked');

        // Step 3: Prepare data to send
        var registrationData = {
            email: email,
            name: name,
            phoneNumber: phoneNumber,
            tower: tower,
            flat: flat,
            gender: gender.value,
            age: age,
            ageGroup: ageGroup.value,
            competitions: competitionInfo,
            foodStalls: foodStallInfo,
            acknowledge: acknowledge,
            paymentOption: paymentOption.value,
            paymentScreenshotBytes: paymentScreenshotBytes,
            paymentScreenshotMimeType: paymentScreenshotMimeType,
        };

        // Step 4: Send data using fetch with payload
        fetch(backendUrl + "?mode=participant", {
            method: "POST",
            mode: "cors",
            cache: "no-cache",
            headers: {
                "Content-Type": "text/plain",
            },
            redirect: "follow",
            body: JSON.stringify(registrationData),
        })
            .then((response) => response.text())
            .then((result) => {
                console.log(result);
                const res = JSON.parse(result);
                if (res.status === "success") {
                    successModal.style.display = "block";
                    errorModal.style.display = "none";
                    document.getElementById("registrationId").textContent = res.registrationId;
                } else {
                    errorModal.style.display = "block";
                    successModal.style.display = "none";
                    document.getElementById("errorInfo").textContent = res.error;
                }
                document.getElementById("loadingSpinner").hidden = true; // Hide spinner
            })
            .catch((error) => {
                console.error("Error:", error);
                errorModal.style.display = "block";
                successModal.style.display = "none";
                document.getElementById("errorInfo").textContent = error;
                document.getElementById("loadingSpinner").hidden = true; // Hide spinner
            });
    });

    // Reset the form and hide the modal when 'Submit New Registration' is clicked
    newRegBtn.addEventListener("click", function (event) {
        event.preventDefault();
        resetAllInputFields();
        successModal.style.display = "none";
        errorModal.style.display = "none";
        form.style.display = "block";

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    });

    // Reset the form and hide the modal when 'Retry Registration' is clicked
    retryRegBtn.addEventListener("click", function (event) {
        event.preventDefault();
        successModal.style.display = "none";
        errorModal.style.display = "none";
        form.style.display = "block";

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    });

    dashboardBtn.addEventListener("click", function (event) {
        window.location.reload();
    });

    registrationTab.addEventListener("click", function (event) {
        event.preventDefault();
        reportTabClicked = "registrationTab";
        registrationsClosedModal.style.display = "block";
    });

    planningReportTab.addEventListener("click", function (event) {
        event.preventDefault();
        reportTabClicked = "planning";
        loginModal.style.display = "block";
    });

    /* winnersFormTab.addEventListener("click", function (event) {
        event.preventDefault();
        reportTabClicked = "winners";
        loginModal.style.display = "block";
    }); */

    paymentReportTab.addEventListener("click", function (event) {
        event.preventDefault();
        reportTabClicked = "payment";
        loginModal.style.display = "block";
    });

    var userEmail, userPasskey;
    loginBtn.addEventListener("click", function (event) {
        event.preventDefault();
        document.getElementById("loadingSpinner").hidden = false;

        userEmail = document.getElementById("userEmail");
        userPasskey = document.getElementById("userPasskey");
        var inputsAreValid = true;

        // Remove previous invalid styles
        [userEmail, userPasskey].forEach((input) => {
            input.classList.remove("is-invalid");
        });

        // Check if the userEmail input is valid
        if (!userEmail.value || !userEmail.validity.valid) {
            userEmail.classList.add("is-invalid");
            inputsAreValid = false;
        }

        // Check if the userPasskey input is non-empty
        if (!userPasskey.value) {
            userPasskey.classList.add("is-invalid");
            inputsAreValid = false;
        }

        if (!inputsAreValid) {
            alert("Please review & fill in all required fields.");
            document.getElementById("loadingSpinner").hidden = true;
            return;
        }

        // AJAX call to Google Apps Script
        fetch(backendUrl + "?mode=admin", {
            method: "POST",
            mode: "cors",
            cache: "no-cache",
            headers: {
                "Content-Type": "text/plain",
            },
            redirect: "follow",
            body: JSON.stringify({
                email: userEmail.value,
                passKey: btoa(userPasskey.value), // Base64 encode
            }),
        })
            .then((response) => response.json())
            .then((data) => {
                console.log(data);
                if (data.access === "granted") {
                    loginModal.style.display = "none";
                    localStorage.setItem('userEmail', userEmail.value);

                    if (reportTabClicked === "planning") {
                        document.querySelector("#planningreport").classList.add("show", "active"); // Display "Planning Report" tab
                        document.querySelector(".nav-link.active").classList.remove("active");
                        planningReportTab.classList.add("active");
                    }

                    if (reportTabClicked === "payment") {
                        document.querySelector("#paymentreport").classList.add("show", "active"); // Display "Payment Report" tab
                        document.querySelector(".nav-link.active").classList.remove("active");
                        paymentReportTab.classList.add("active");
                    }

                    /* if (reportTabClicked === "winners") {
                        document.querySelector("#winnersForm").classList.add("show", "active"); // Display "Winners" tab
                        document.querySelector(".nav-link.active").classList.remove("active");
                        winnersFormTab.classList.add("active");
                        initializeWinnersForm();
                    } */

                } else {
                    alert("You do not have admin access. Please reach out to the team.");
                    userEmail.classList.add("is-invalid");
                    userPasskey.classList.add("is-invalid");
                }
                document.getElementById("loadingSpinner").hidden = true; // Hide spinner
            })
            .catch((error) => {
                console.error("Error:", error);
                errorModal.style.display = "block";
                loginModal.style.display = "none";
                document.getElementById("errorInfo").textContent = error;
                document.getElementById("loadingSpinner").hidden = true; // Hide spinner
            });
    });

    // When the user clicks on <span> (x), close the modal
    successModalCloseBtn.onclick = function () {
        successModal.style.display = "none";
    };

    errorModalCloseBtn.onclick = function () {
        errorModal.style.display = "none";
    };

    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function (event) {
        if (event.target === successModal || event.target === errorModal) {
            successModal.style.display = "none";
            errorModal.style.display = "none";
        }

        if (event.target === loginModal) {
            loginModal.style.display = "block";
        }
    };

    // --- Winner form
    function initializeWinnersForm() {
        populateCategories();
        document.getElementById('eventName').innerHTML = "";
        document.getElementById('ageGroup').innerHTML = "";
    }

    function populateCategories() {
        let categories = competitionsData.map(comp => comp.category);
        let categorySelect = document.getElementById('category');
        categorySelect.innerHTML = `<option value="">Select</option>` + categories
            .map(category => `<option value="${category}">${category}</option>`)
            .join('');

        categorySelect.value = "";
    }

    document.getElementById('category').addEventListener('change', populateNames);

    function populateNames() {
        let selectedCategory = document.getElementById('category').value;
        if (!selectedCategory) {
            document.getElementById('eventName').innerHTML = `<option value="">Select</option>`;
            updateAgeGroupsAndGender();  // To reset subsequent dropdowns
            return;
        }

        let names = competitionsData
            .find(comp => comp.category === selectedCategory)
            ?.competitions
            ?.map(comp => comp.name) || [];

        let nameSelect = document.getElementById('eventName');
        nameSelect.innerHTML = `<option value="">Select</option>` + names
            .map(name => `<option value="${name}">${name}</option>`)
            .join('');

        nameSelect.value = "";
    }

    document.getElementById('eventName').addEventListener('change', function () {
        updateAgeGroupsAndGender();
        updateWinnerInputSection(this.value);
    });

    function updateAgeGroupsAndGender() {
        let selectedCategory = document.getElementById('category').value;
        let selectedName = document.getElementById('eventName').value;
        if (!selectedCategory || !selectedName) {
            document.getElementById('ageGroup').innerHTML = `<option value="">Select</option>`;
            return;
        }

        let ageGroups = competitionsData
            .find(comp => comp.category === selectedCategory)
            ?.competitions
            .find(comp => comp.name === selectedName)
            ?.ageGroups || [];

        let ageGroupSelect = document.getElementById('ageGroup');
        ageGroupSelect.innerHTML = `<option value="">Select</option>` + `<option value="N/A">N/A</option>` + ageGroups
            .map(ageGroup => `<option value="${ageGroup}">${ageGroup}</option>`)
            .join('');

        ageGroupSelect.value = "";
    }

    document.getElementById('eventConducted').addEventListener('change', function () {
        var displayStyle = this.value === 'No' ? 'none' : 'block';
        document.getElementById('firstPlaceSection').style.display = displayStyle;
        document.getElementById('secondPlaceSection').style.display = displayStyle;
    });

    function updateWinnerInputSection(eventName) {
        const numberOfWinners = findNumberOfWinners(eventName);
        createWinnerInputs(numberOfWinners, 'firstPlaceContent', 'first');
        createWinnerInputs(numberOfWinners, 'secondPlaceContent', 'second');
        loadDataAndApplyAutocomplete();
    }

    function findNumberOfWinners(eventName) {
        for (const category of competitionsData) {
            for (const competition of category.competitions) {
                if (competition.name === eventName) {
                    return competition.numberOfWinners;
                }
            }
        }
        return 0; // Default to 0 if no match is found
    }

    function createWinnerInputs(numberOfWinners, containerId, positionPrefix) {
        const container = document.getElementById(containerId);
        if (!container) {
            return; // Ensure winnerSection div exists
        }

        let inputHtml = '';
        for (let i = 1; i <= numberOfWinners; i++) {
            var labelPrefix = numberOfWinners === 1 ? '' : 'Player - ' + i + ' ';
            inputHtml += `
                <div class="mb-3">
                <label for="${positionPrefix}PlaceName-${i}" class="form-label" style="font-weight: bold;">${labelPrefix}Name:</label>
                <input type="text" id="${positionPrefix}PlaceName-${i}" class="form-control name-input">
                </div>
                <div class="mb-3">
                <label for="${positionPrefix}PlaceApartment-${i}" class="form-label" style="font-weight: bold;">${labelPrefix}Apartment Number:</label>
                <input type="text" id="${positionPrefix}PlaceApartment-${i}" class="form-control apartment-input">
                </div>
            `;
        }
        container.innerHTML = inputHtml;
    }

    winnersFormSubmitBtn.addEventListener("click", function (event) {
        event.preventDefault();
        document.getElementById("loadingSpinner").hidden = false; // Show spinner

        if (!validateWinnerForm()) {
            alert("Please review & fill in all required fields.");
            document.getElementById("loadingSpinner").hidden = true; // Hide spinner
            return false;
        }

        let winnerFormData = gatherWinnerFormData();

        fetch(backendUrl + "?mode=winner", {
            method: "POST",
            mode: "cors",
            cache: "no-cache",
            headers: {
                "Content-Type": "text/plain",
            },
            redirect: "follow",
            body: JSON.stringify(winnerFormData),
        })
            .then((response) => response.text())
            .then((result) => {
                console.log(result);
                const res = JSON.parse(result);
                if (res.status === "success") {
                    alert(`Entry submitted!`);
                    resetAllInputFields();
                } else {
                    alert('Failed to submit entry.');
                }
                document.getElementById("loadingSpinner").hidden = true; // Hide spinner
            })
            .catch((error) => {
                console.error('Failed to submit entry:', error);
                alert('Failed to submit entry. Check console for logs..');
                document.getElementById("loadingSpinner").hidden = true; // Hide spinner
            });

    });

    function validateWinnerForm() {
        let isValid = true;

        let dropdowns = ['category', 'eventName', 'ageGroup', 'genderFormat'];

        dropdowns.forEach(id => {
            let element = document.getElementById(id);
            if (element.value === "") {
                element.classList.add('error'); // Apply an error class for styling
                isValid = false;
            } else {
                element.classList.remove('error'); // Remove error class if selection is valid
            }
        });

        let shouldValidateWinnerInfo = document.getElementById('eventConducted').value === 'No' ? false : true;
        if (shouldValidateWinnerInfo) {

            // Validate all name fields
            document.querySelectorAll('.name-input').forEach(input => {
                if (!input.value.trim()) {
                    input.style.borderColor = 'red';
                    isValid = false;
                } else {
                    input.style.borderColor = 'initial';
                }
            });

            // Validate all apartment fields
            document.querySelectorAll('.apartment-input').forEach(input => {
                if (!input.value.trim()) {
                    input.style.borderColor = 'red';
                    isValid = false;
                } else {
                    input.style.borderColor = 'initial';
                }
            });
        }

        return isValid;
    }

    function gatherWinnerFormData() {

        const winnerInfo = {
            firstPlace: [],
            secondPlace: []
        };

        // Get all name and apartment inputs
        const nameInputs = document.querySelectorAll('.name-input');
        const apartmentInputs = document.querySelectorAll('.apartment-input');

        // Assuming every name input has a corresponding apartment input
        for (let i = 0; i < nameInputs.length; i++) {
            const place = i % 2 === 0 ? 'firstPlace' : 'secondPlace';  // Alternate between first and second place
            const entry = {
                name: nameInputs[i].value.trim(),
                apartment: apartmentInputs[i].value.trim()
            };

            // Push entry to the correct place
            winnerInfo[place].push(entry);
        }

        let formData = {
            category: document.getElementById('category').value,
            eventName: document.getElementById('eventName').value,
            ageGroup: document.getElementById('ageGroup').value,
            genderFormat: document.getElementById('genderFormat').value,
            firstPlace: winnerInfo.firstPlace,
            secondPlace: winnerInfo.secondPlace,
            additionalRemarks: document.getElementById('additionalRemarks').value,
            adminEmail: localStorage.getItem('userEmail')
        };

        return formData;
    }
});

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
        const total = calculateFoodStallCount() * 700 + 600;
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
                    <input class="form-check-input" type="checkbox" id="${checkboxId}" name="competitions">
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