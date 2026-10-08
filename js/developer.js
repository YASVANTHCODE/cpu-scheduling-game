// ==============================
// DEVELOPER PAGE
// ==============================

let developerLogoButton =
    document.getElementById("developer-logo-button");

let developerPage =
    document.getElementById("developer-page");

let developerCloseButton =
    document.getElementById("developer-close-button");

function openDeveloperPage() {
    developerPage.classList.add("open");
    developerPage.setAttribute("aria-hidden", "false");
}

function closeDeveloperPage() {
    developerPage.classList.remove("open");
    developerPage.setAttribute("aria-hidden", "true");
}

developerLogoButton.addEventListener("click", openDeveloperPage);
developerCloseButton.addEventListener("click", closeDeveloperPage);

developerPage.addEventListener("click", function(event) {
    if (event.target === developerPage) {
        closeDeveloperPage();
    }
});

document.addEventListener("keydown", function(event) {
    if (event.key === "Escape" && developerPage.classList.contains("open")) {
        closeDeveloperPage();
    }
});
