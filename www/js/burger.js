const hamburger = document.getElementById("openMobile");
let burgerOpen = false;

hamburger.onclick = () => {
    burgerOpen = !burgerOpen;

    hamburger.style.transform = burgerOpen ? "rotate(90deg)" : "rotate(0)";
    document.getElementById("mlinks").style.transform = burgerOpen ? "translateY(0)" : "translateY(-50vh)";
}