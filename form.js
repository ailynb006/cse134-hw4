document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("contact-form");
    //form check so the darkmode works on the non-form pages
    if (form) {
        const firstName = document.getElementById("firstName");
        const lastName = document.getElementById("lastName");
        const email = document.getElementById("email");
        const comments = document.getElementById("comments");
        const errorArea = document.getElementById("form-error-area");
        const infoArea = document.getElementById("form-info-area");
        const formErrorsInput = document.getElementById("form-errors-input");

        const fields = [
            {el: firstName, label: "First Name"},
            {el: lastName, label: "Last Name"},
            {el: email, label: "Email"},
            {el: comments, label: "Message"}
        ];

        //reveal info when js is active (progressive enhancement yaay)
        infoArea.hidden = false;

        const form_errors = [];
        let currentAttemptLoggedFields = new Set();
        let attemptResetsScheduled = false;

        function evaluateField(fieldObj) {
            const { el, label } = fieldObj;
            el.setCustomValidity("");
            const v = el.validity;
            if (v.valueMissing) {
                el.setCustomValidity(`${label} is required. Please fill out this field.`);
            } else if (el.type === "email" && v.typeMismatch) {
                el.setCustomValidity(`Please enter a valid email address (for example, name@example.com).`);
            } else if (v.tooShort) {
                el.setCustomValidity(`${label} is too short. Please enter at least ${el.minLength} characters (currently ${el.value.length}).`);
            } else if (v.tooLong) {
                el.setCustomValidity(`${label} exceeds the maximum limit of ${el.maxLength} characters.`);
            }
            return el.validationMessage;
        }

        function renderErrors(activeErrors) {
            if (activeErrors.length === 0) {
                errorArea.textContent = "";
                errorArea.hidden = true;
            } else {
                errorArea.hidden = false;
                errorArea.innerHTML = activeErrors
                    .map(err => `<div><strong>${err.label}:</strong> ${err.message}</div>`)
                    .join("");
            }
        }

        const touchedFields = new Set(); //check edited fields

        function checkTouchedFields() {
            const activeErrors = [];
            for (const fieldObj of fields) {
                const msg = evaluateField(fieldObj);
                if (touchedFields.has(fieldObj.el) && msg) {
                    activeErrors.push({ label: fieldObj.label, message: msg });
                }
            }
            renderErrors(activeErrors);
        }

        fields.forEach(fieldObj => {
            //error when leaving edited field
            fieldObj.el.addEventListener("blur", () => {
                touchedFields.add(fieldObj.el);
                checkTouchedFields();
            });

            //update error after correction
            fieldObj.el.addEventListener("input", () => {
                if (touchedFields.has(fieldObj.el)) {
                    checkTouchedFields();
                } else {
                    evaluateField(fieldObj);
                }
            });
        });

        //char counter for comments
        const maxChars = parseInt(comments.getAttribute("maxlength"), 10) || 1000;
        const warningThreshold = 100; //warn when less than 100 chars are left

        function updateCharacterCount() {
            const remaining = maxChars - comments.value.length;
            infoArea.classList.remove("warning", "at-limit");

            if (remaining === 0) {
                infoArea.textContent = "0 characters remaining - you have reached the 1,000-character limit.";
                infoArea.classList.add("at-limit");
            } else if (remaining <= warningThreshold) {
                infoArea.textContent = `Warning: Only ${remaining} character${remaining === 1 ? "" : "s"} remaining.`;
                infoArea.classList.add("warning");
            } else {
                infoArea.textContent = `${remaining} characters remaining.`;
            }
        }

        comments.addEventListener("input", updateCharacterCount);
        updateCharacterCount(); //initialize count on page load

        //catching 'invalid' elems when attempting to submit
        form.addEventListener("invalid", (event) => {
            const invalidEl = event.target;
            const fieldObj = fields.find(f => f.el === invalidEl);
            if (!fieldObj) return;

            //mark field as touched so error stays visible until fixed
            touchedFields.add(invalidEl);
            const message = evaluateField(fieldObj);

            //record each invalid field once for every failed submission
            if (!currentAttemptLoggedFields.has(invalidEl.name)) {
                currentAttemptLoggedFields.add(invalidEl.name);
                form_errors.push({
                    field: invalidEl.name,
                    label: fieldObj.label,
                    error: message
                });
            }

            //reset failed submission set after validation passes
            if (!attemptResetsScheduled) {
                attemptResetsScheduled = true;
                setTimeout(() => {
                    currentAttemptLoggedFields.clear();
                    attemptResetsScheduled = false;
                    checkTouchedFields();
                }, 0);
            }
        }, true);

        form.addEventListener("submit", () => {
            formErrorsInput.value = JSON.stringify(form_errors);
        });
    }

    //darkmode toggle button
    document.body.classList.add("js-loaded");
    const themeSwitch = document.getElementById("theme-switch");

    //read mode saved in localstorage
    let darkMode = null;
    try {
        darkMode = localStorage.getItem("darkMode");
    } catch (e) {
        console.warn("localStorage is inaccessible:", e);
    }

    //apply stored preference on page load
    if (darkMode === "active") {
        document.body.classList.add("darkmode");
        if (themeSwitch) {
            themeSwitch.setAttribute("aria-label", "Switch to light theme");
        }
    }

    //theme switch
    if (themeSwitch) {
        themeSwitch.addEventListener("click", () => {
            // Define the core theme-switching logic
            const toggleThemeAction = () => {
                try {
                    darkMode = localStorage.getItem("darkMode");
                } catch (e) {
                    console.warn("localStorage is inaccessible:", e);
                }

                if (darkMode !== "active") {
                    //enable dark mode
                    document.body.classList.add("darkmode");
                    themeSwitch.setAttribute("aria-label", "Switch to light theme");
                    try {
                        localStorage.setItem("darkMode", "active");
                    } catch (e) {
                        console.warn("Could not save theme preference:", e);
                    }
                } else {
                    //disable dark mode
                    document.body.classList.remove("darkmode");
                    themeSwitch.setAttribute("aria-label", "Switch to dark theme");
                    try {
                        localStorage.setItem("darkMode", null);
                    } catch (e) {
                        console.warn("Could not clear theme preference:", e);
                    }
                }
            };

            //check for reduced motion preferences or browser support
            const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

            if (!document.startViewTransition || prefersReducedMotion) {
                // run instantly without animation
                toggleThemeAction();
            } else {
                //animate the transition
                document.startViewTransition(() => {
                    toggleThemeAction();
                });
            }
        });
    }
});