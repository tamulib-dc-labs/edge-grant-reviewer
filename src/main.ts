import { MediaFile } from "./types/media";
import "./style.css";
import "whisper-transcript-sticky";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'whisper-transcript': any;
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const controlsContainer = document.getElementById("controls-container");
  const transcriptContainer = document.getElementById("transcript-container");

  fetch("./config.json")
    .then((response) => response.json())
    .then((mediaFiles: MediaFile[]) => {
      const dropdown = document.createElement("select");
      dropdown.id = "audio-dropdown";

      const placeholder = document.createElement("option");
      placeholder.className = "text-black";
      placeholder.disabled = true;
      placeholder.selected = true;
      placeholder.textContent = "Choose an audio file...";
      dropdown.appendChild(placeholder);

      function hasName(file: unknown): file is { name: string } {
        return !!file && typeof file === 'object' && 'name' in file;
      }

      const validMediaFiles = mediaFiles.filter(hasName);
      validMediaFiles.sort((a, b) => a.name.localeCompare(b.name));

      validMediaFiles.forEach((file, index) => {
        const option = document.createElement("option");
        option.value = index.toString();
        option.textContent = file.name;
        dropdown.appendChild(option);
      });

      const vttButton = document.createElement("a");
      vttButton.className = "btn btn-primary btn-sm mt-2";
      vttButton.target = "_blank";
      vttButton.textContent = "Download VTT";

      if (controlsContainer) {
        const label = document.createElement("label");
        label.className = "block text-white text-sm font-medium mb-2";
        label.textContent = "Select Audio File:";

        controlsContainer.appendChild(label);
        controlsContainer.appendChild(dropdown);
        controlsContainer.appendChild(vttButton);
      }

      let whisperElement = document.createElement("whisper-transcript");

      const updateWhisperTranscript = (index: number) => {
        const selectedFile = validMediaFiles[index];

        if (whisperElement && transcriptContainer?.contains(whisperElement)) {
          transcriptContainer.removeChild(whisperElement);
        }

        // Create new Whisper JSON Viewer / Player
        whisperElement = document.createElement("whisper-transcript");
        whisperElement.setAttribute("audio", selectedFile.audio);
        whisperElement.setAttribute("url", selectedFile.url);

        // Add it to the transcript container
        if (transcriptContainer) {
          transcriptContainer.innerHTML = "";
          transcriptContainer.appendChild(whisperElement);
        }

        // Update the VTT button to point at the current
        if (selectedFile.vtt) {
          vttButton.href = selectedFile.vtt;
          vttButton.textContent = `Download VTT - ${selectedFile.name}`;
          vttButton.classList.remove("btn-disabled");
        } else {
          vttButton.removeAttribute("href");
          vttButton.textContent = "No VTT Available";
          vttButton.classList.add("btn-disabled");
        }
      };

      // Update If Dropdown Is Touched
      dropdown.addEventListener("change", (event) => {
        const index = parseInt((event.target as HTMLSelectElement).value);
        updateWhisperTranscript(index);
      });

      // Load the first guy
      if (validMediaFiles.length > 0) {
        updateWhisperTranscript(0);
        dropdown.selectedIndex = 1; // Skip placeholder
      }
    })
    .catch((error) => {
      console.error("Error loading media files:", error);

      // If no media to load, say so
      if (controlsContainer) {
        controlsContainer.innerHTML = `
          <div class="alert alert-error">
            <span>Error loading audio files. Please check your configuration.</span>
          </div>
        `;
      }
    });
});