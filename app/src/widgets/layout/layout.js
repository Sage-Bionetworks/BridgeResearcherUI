class BsmLayout extends HTMLElement {
  constructor() {
    super();
    let headers = this.querySelectorAll("div[slot='header']");
    let content = this.querySelector("div[slot='content']");
    let help = this.querySelector("div[slot='help']");

    let headerHtml = '';
    if (headers.length) {
      headers.forEach(header => {
        headerHtml += `<div class="ui grid">
          <div class="eleven wide column" style="padding-bottom:0">
            ${header.innerHTML}
          </div>
        </div>`;
      });
    }
    let contentHtml = (content) ? content.innerHTML : null;

    let helpHtml = '';
    if (help) {
      helpHtml = `<div class="ui message">${help.innerHTML}</div>`;
    }

    const root = document.createElement('div');
    root.className = 'scrollbox';
    // form is included in this wrapper so in many places, it could be removed;
    // it's only there so Semantic UI CSS renders form elements correctly
    root.innerHTML = `
      ${headerHtml}
      <div class="ui grid">
        <div class="eleven wide column ui form">
          <errors id="${this.getAttribute('id')}"></errors>
          ${contentHtml}
        </div>
        <div class="five wide column">
          ${helpHtml}
        </div>
      </div>`;
    this.innerHTML = '';
    this.appendChild(root);
  }
}

customElements.define('bsm-layout', BsmLayout);