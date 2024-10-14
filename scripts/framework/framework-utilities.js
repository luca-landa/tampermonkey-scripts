// ==UserScript==
// @name         Multi-page Automation Script
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Example script to automate tasks across pages
// @match        *://*.frame.work/*
// @grant        none
// ==/UserScript==

const COMMANDS_NAMESPACE = 'vimium_commands';

window.vimium_commands_interval = null;
let interval = null;

const commandsMapping = {
  'add-to-bag': () => {
    clickButton('add to bag');
  },
  'select-configurator-form': () => {
    let inputs = Array.from(document.querySelectorAll('input'))
      .filter((input) => input.name.includes('product_configuration'));

    let selectedInputNames = [];

    inputs.forEach((input) => {
      if (input.name.includes('multiple_selection')) return;
      if (selectedInputNames.includes(input.name)) return;
      if (input.value == 0 || input.disabled) return;

      if (!(input.type == 'checkbox' && input.checked)) input.click();
      selectedInputNames.push(input.name);
    });
  },
  'start-16-diy-configuration': () => {
    visitPath('products/laptop16-diy-amd-7040/configuration/new');
  },
  'visit-usb-a-expansion-card-page': () => {
    visitPath('products/usb-a-expansion-card');
  },
  'visit-cart': () => {
    visitPath('cart');
  }
};

function runCommand(command) {
  try {
    console.log(COMMANDS_NAMESPACE, `executing: "${command}"`);
    commandsMapping[command]();
  } catch (error) {
    console.warn(error);
  }
}

function checkPendingCommands() {
  let commands = JSON.parse(localStorage.getItem(COMMANDS_NAMESPACE) || '[]');
  if (commands.length === 0) return;

  let firstCommand = commands.shift();
  localStorage.setItem(COMMANDS_NAMESPACE, JSON.stringify(commands));

  if (commandsMapping[firstCommand]) {
    runCommand(firstCommand);
  } else {
    console.warn(COMMANDS_NAMESPACE, `command not found: "${firstCommand}"`);
  }
}

function clickButton(text) {
  let buttons = document.querySelectorAll('button');
  buttons.forEach(button => {
    if (button.textContent.toLowerCase().includes(text)) {
      button.click();
    }
  });
}

function visitPath(path) {
  const baseUrl = window.location.origin;
  const newUrl = `${baseUrl}/${path}`;
  window.location.href = newUrl;
}

function addCommands(...commands) {
  let newCommands = JSON.parse(localStorage.getItem(COMMANDS_NAMESPACE) || '[]');
  newCommands.push(...commands);
  localStorage.setItem(COMMANDS_NAMESPACE, JSON.stringify(newCommands));
}

function setup() {
  window.vimium_commands_interval = setInterval(() => checkPendingCommands(), 1000);
}

(function() {
  window.frameworkUtilities = { addCommands };
  window.addEventListener('beforeunload', function () {
    clearInterval(window.vimium_commands_interval);
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setup());
  } else {
    setup()
  }
})();
