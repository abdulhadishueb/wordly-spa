// student style JS (simple and clear)

let form = document.getElementById("searchForm");
let input = document.getElementById("searchInput");
let message = document.getElementById("message");
let result = document.getElementById("result");

let savedList = document.getElementById("savedList");
let clearBtn = document.getElementById("clearBtn");
let themeBtn = document.getElementById("themeBtn");

let API = "https://api.dictionaryapi.dev/api/v2/entries/en/";
let STORAGE_KEY = "wordly_saved_words";
let THEME_KEY = "wordly_theme";

// load saved words from localStorage
let savedWords = [];
let savedFromStorage = localStorage.getItem(STORAGE_KEY);
if (savedFromStorage) {
  savedWords = JSON.parse(savedFromStorage);
}

// load theme
let savedTheme = localStorage.getItem(THEME_KEY);
if (savedTheme === "dark") {
  document.body.classList.add("dark");
}

renderSavedWords();

// form submit event
form.addEventListener("submit", function (e) {
  e.preventDefault();

  let word = input.value.trim();

  if (word === "") {
    message.textContent = "Please type a word first.";
    message.className = "error";
    result.innerHTML = "";
    return;
  }

  searchWord(word);
});

// theme toggle (dynamic CSS)
themeBtn.addEventListener("click", function () {
  document.body.classList.toggle("dark");

  if (document.body.classList.contains("dark")) {
    localStorage.setItem(THEME_KEY, "dark");
  } else {
    localStorage.setItem(THEME_KEY, "light");
  }
});

// clear favorites
clearBtn.addEventListener("click", function () {
  savedWords = [];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(savedWords));
  renderSavedWords();
  message.textContent = "Saved words cleared.";
  message.className = "";
});

// fetch function
function searchWord(word) {
  message.textContent = "Searching...";
  message.className = "";
  result.innerHTML = "";

  fetch(API + encodeURIComponent(word))
    .then(function (response) {
      if (!response.ok) {
        throw new Error("Word not found. Try another word.");
      }
      return response.json();
    })
    .then(function (data) {
      showResult(data);
      message.textContent = "Done.";
      message.className = "";
    })
    .catch(function (error) {
      message.textContent = error.message;
      message.className = "error";
      result.innerHTML = "";
    });
}

// display results
function showResult(data) {
  let entry = data[0];

  let word = entry.word;

  // phonetic text
  let phoneticText = "";
  if (entry.phonetic) {
    phoneticText = entry.phonetic;
  } else if (entry.phonetics && entry.phonetics.length > 0) {
    for (let i = 0; i < entry.phonetics.length; i++) {
      if (entry.phonetics[i].text) {
        phoneticText = entry.phonetics[i].text;
        break;
      }
    }
  }

  // audio
  let audioUrl = "";
  if (entry.phonetics && entry.phonetics.length > 0) {
    for (let i = 0; i < entry.phonetics.length; i++) {
      if (entry.phonetics[i].audio) {
        audioUrl = entry.phonetics[i].audio;
        break;
      }
    }
  }

  // meaning/definition
  let partOfSpeech = "N/A";
  let definition = "No definition found.";
  let example = "No example provided.";
  let synonyms = [];

  if (entry.meanings && entry.meanings.length > 0) {
    let meaning = entry.meanings[0];
    if (meaning.partOfSpeech) partOfSpeech = meaning.partOfSpeech;

    if (meaning.definitions && meaning.definitions.length > 0) {
      if (meaning.definitions[0].definition) definition = meaning.definitions[0].definition;
      if (meaning.definitions[0].example) example = meaning.definitions[0].example;

      // sometimes synonyms are inside definitions too
      if (meaning.definitions[0].synonyms && meaning.definitions[0].synonyms.length > 0) {
        synonyms = meaning.definitions[0].synonyms;
      }
    }

    // sometimes synonyms are directly in meaning
    if (meaning.synonyms && meaning.synonyms.length > 0 && synonyms.length === 0) {
      synonyms = meaning.synonyms;
    }
  }

  // sources
  let sourceHtml = "No source link.";
  if (entry.sourceUrls && entry.sourceUrls.length > 0) {
    sourceHtml = `<a href="${entry.sourceUrls[0]}" target="_blank" rel="noreferrer">Open source</a>`;
  }

  // save button text
  let lower = word.toLowerCase();
  let isSaved = savedWords.includes(lower);

  result.innerHTML = `
    <div class="wordTitle">
      <h2>${word}</h2>
      ${phoneticText ? `<span class="badge">${phoneticText}</span>` : ""}
      <button id="saveBtn" type="button">${isSaved ? "Saved ✓" : "Save"}</button>
    </div>

    <div class="block">
      <h3>Pronunciation</h3>
      ${audioUrl ? `<audio controls src="${audioUrl}"></audio>` : `<p>No audio available.</p>`}
    </div>

    <div class="block">
      <h3>Meaning</h3>
      <p><strong>Part of speech:</strong> ${partOfSpeech}</p>
      <p><strong>Definition:</strong> ${definition}</p>
      <p><strong>Example:</strong> ${example}</p>
    </div>

    <div class="block">
      <h3>Synonyms</h3>
      <div id="synonymsBox"></div>
    </div>

    <div class="block">
      <h3>Source</h3>
      ${sourceHtml}
    </div>
  `;

  // handle save click
  let saveBtn = document.getElementById("saveBtn");
  saveBtn.addEventListener("click", function () {
    toggleSave(word);
    // update button text after saving/removing
    let nowSaved = savedWords.includes(word.toLowerCase());
    saveBtn.textContent = nowSaved ? "Saved ✓" : "Save";
    renderSavedWords();
  });

  // show synonyms as clickable buttons
  let synonymsBox = document.getElementById("synonymsBox");
  synonymsBox.innerHTML = "";

  if (!synonyms || synonyms.length === 0) {
    synonymsBox.innerHTML = `<p>No synonyms found.</p>`;
  } else {
    // limit to 10 so it doesn't look messy
    for (let i = 0; i < synonyms.length && i < 10; i++) {
      let btn = document.createElement("button");
      btn.className = "synBtn";
      btn.type = "button";
      btn.textContent = synonyms[i];

      // click synonym to search it
      btn.addEventListener("click", function () {
        input.value = synonyms[i];
        searchWord(synonyms[i]);
      });

      synonymsBox.appendChild(btn);
    }
  }
}

// save/remove favorite word
function toggleSave(word) {
  let w = word.toLowerCase();

  if (savedWords.includes(w)) {
    // remove
    let newArr = [];
    for (let i = 0; i < savedWords.length; i++) {
      if (savedWords[i] !== w) {
        newArr.push(savedWords[i]);
      }
    }
    savedWords = newArr;
    message.textContent = "Removed from saved words.";
    message.className = "";
  } else {
    // add
    savedWords.push(w);
    message.textContent = "Saved word added!";
    message.className = "";
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(savedWords));
}

// show saved words list
function renderSavedWords() {
  savedList.innerHTML = "";

  if (savedWords.length === 0) {
    savedList.innerHTML = "<li>No saved words yet.</li>";
    return;
  }

  for (let i = 0; i < savedWords.length; i++) {
    let li = document.createElement("li");
    li.className = "savedItem savedHighlight";

    li.innerHTML = `
      <span>${savedWords[i]}</span>
      <div>
        <button class="smallBtn" type="button">Search</button>
        <button class="smallBtn danger" type="button">Remove</button>
      </div>
    `;

    // search button
    let searchBtn = li.querySelectorAll("button")[0];
    searchBtn.addEventListener("click", function () {
      input.value = savedWords[i];
      searchWord(savedWords[i]);
    });

    // remove button
    let removeBtn = li.querySelectorAll("button")[1];
    removeBtn.addEventListener("click", function () {
      removeSaved(savedWords[i]);
      renderSavedWords();
    });

    savedList.appendChild(li);
  }
}

// remove saved word helper
function removeSaved(word) {
  let w = word.toLowerCase();
  let newArr = [];

  for (let i = 0; i < savedWords.length; i++) {
    if (savedWords[i] !== w) {
      newArr.push(savedWords[i]);
    }
  }

  savedWords = newArr;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(savedWords));
  message.textContent = "Removed saved word.";
  message.className = "";
}
