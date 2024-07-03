const hamburger = document.querySelector('.hamburger')
const linksContainer = document.querySelector('.links-container')

hamburger.addEventListener('click', ()=> {
  linksContainer.classList.toggle('active')
})