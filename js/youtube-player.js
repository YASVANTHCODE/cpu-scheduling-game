// ==============================
// ALGORITHM YOUTUBE MINI PLAYER
// ==============================

const algorithmVideos = {
    FCFS: {
        title: "FCFS Explanation",
        videoId: "lc4Wi4kAifE"
    },
    SJF: {
        title: "SJF Explanation",
        videoId: "FGey8sDs3YA"
    },
    SRTF: {
        title: "SRTF Explanation",
        videoId: "xiDsMjBIivI"
    },
    RR: {
        title: "Round Robin Explanation",
        videoId: "aWlQYllBZDs"
    }
};

let youtubePlayerPanel = null;
let youtubePlayerFrame = null;
let youtubePlayerTitle = null;

function initializeYouTubePlayer() {
    youtubePlayerPanel = document.getElementById("youtube-player-panel");
    youtubePlayerFrame = document.getElementById("youtube-player-frame");
    youtubePlayerTitle = document.getElementById("youtube-player-title");

    let openButton = document.getElementById("youtube-player-open");

    openButton.addEventListener("click", function() {
        openCurrentYouTubeVideo();
    });
}

function showYouTubePlayer(algorithm) {
    let video = algorithmVideos[algorithm];

    if (!video || !youtubePlayerPanel) {
        return;
    }

    youtubePlayerTitle.textContent = video.title;
    let embedUrl = "https://www.youtube.com/embed/" + video.videoId +
        "?rel=0&playsinline=1";

    // YouTube introduced error 153 for embeds that do not provide
    // a valid HTTP Referer / client identity. When the game is hosted
    // over HTTP(S), provide the page origin explicitly.
    if (window.location.protocol === "http:" || window.location.protocol === "https:") {
        embedUrl += "&origin=" + encodeURIComponent(window.location.origin);
    }

    youtubePlayerFrame.src = embedUrl;

    youtubePlayerPanel.classList.add("youtube-player-visible");
    youtubePlayerPanel.setAttribute("aria-hidden", "false");
}

function hideYouTubePlayer() {
    if (!youtubePlayerPanel) {
        return;
    }

    youtubePlayerPanel.classList.remove("youtube-player-visible");
    youtubePlayerPanel.setAttribute("aria-hidden", "true");

    // Stop playback when the player is hidden.
    youtubePlayerFrame.src = "";
}

function openCurrentYouTubeVideo() {
    if (!currentAlgorithm || !algorithmVideos[currentAlgorithm]) {
        return;
    }

    let videoId = algorithmVideos[currentAlgorithm].videoId;
    window.open(
        "https://www.youtube.com/watch?v=" + videoId,
        "_blank",
        "noopener,noreferrer"
    );
}
