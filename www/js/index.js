document.addEventListener("DOMContentLoaded", async () => {
    const req1 = await fetch("/api/youtube/latest");
    const res1 = await req1.json();

    document.getElementById("latest-vid").src = `https://www.youtube.com/embed/${res1.id}`;

    const req2 = await fetch("/api/youtube/best");
    const res2 = await req2.json();

    document.getElementById("best-vid").src = `https://www.youtube.com/embed/${res2.id}`;
});