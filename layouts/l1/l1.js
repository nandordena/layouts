const button = document.getElementById("action-btn");
const message = document.querySelector(".hero p");

const mensajes = [
  "Ejemplo simple con estilos y script separados.",
  "Puedes duplicar este layout para crear más variaciones.",
  "CSS y JS viven en archivos distintos para mantener orden.",
];

let indice = 0;

button?.addEventListener("click", () => {
  indice = (indice + 1) % mensajes.length;
  if (message) {
    message.textContent = mensajes[indice];
  }
});

