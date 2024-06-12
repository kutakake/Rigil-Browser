const { invoke } = window.__TAURI__.tauri;

let greetInputEl;
let greetMsgEl;

async function goto_page(url) {
  // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
  document.write("it works!");
  document.getElementById('test').getElementById('body2').innerHTML = await invoke('greet', { name: url });
  //greetMsgEl.textContent = await invoke("greet", { name: greetInputEl.value });
}

async function greet() {
  // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
  document.getElementById('body2').innerHTML = await invoke('greet', { name: greetInputEl.value });
  //greetMsgEl.textContent = await invoke("greet", { name: greetInputEl.value });
}

window.addEventListener("DOMContentLoaded", () => {
  greetInputEl = document.querySelector("#greet-input");
  greetMsgEl = document.querySelector("#greet-msg");
  document.querySelector("#greet-form").addEventListener("submit", (e) => {
    e.preventDefault();
    greet();
  });
});/*
window.addEventListener("DOMContentLoaded", () => {
  greetInputEl = document.querySelector("#page_button");
  document.addEventListener("click", (e) => {
    e.preventDefault();
    greet();
  });
});*/