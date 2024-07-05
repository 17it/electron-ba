import { pairs } from '../../config/const'

window.addEventListener('DOMContentLoaded', () => {
    setPage()
})

function setPage() {
    var dom = document.getElementById('pairWrap')

    console.log('sssss', pairs)

    dom.innerHTML = JSON.stringify(pairs)
}
