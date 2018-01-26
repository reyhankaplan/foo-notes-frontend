const $ = document.querySelector.bind(document)

// Server'ımızın url'i; localhost, 8000 portu
const url = 'http://127.0.0.1:8000'

const createNoteBtn = $('#createNote')
const titleInpt = $('#title')
const contentInpt = $('#content')
const listEl = $('#noteList')

/**
 * Sayfa yüklendiğinde var olan veriyi çekmek için GET request yolluyoruz
 */
addEventListener('load', e => {
    makeRequest({
        data: null,
        method: 'GET',
        expectedStatus: 200
    })
})

createNoteBtn.addEventListener('click', createNote)

/**
 * Bu fonksiyon kullanıcının istenen miktarda 
 * veri girip girmediğini kontrol ediyor
 */
function validateData() {
    if (!titleInpt.value) {
        return { valid: false, reason: 'Title is empty' }
    }
    if (contentInpt.value.length < 4) {
        return {
            valid: false,
            reason: 'Content should contain 4 characters at least'
        }
    }
    if (titleInpt.value.length > 32) {
        return { valid: false, reason: 'Title can contain 32 characters' }
    }
    if (contentInpt.value.length > 140) {
        return { valid: false, reason: 'Content can contain 140 characters' }
    }

    return { valid: true }
}
/**
 * Uygulamada sağ kısımda yer alan alanda not oluşturulmak için 
 * butona tıklandığında bu fonksiyon çağırılıyor 
 */
function createNote() {
    // ilk önce veriyi kontrol ediyor
    let check = validateData()

    if (!check.valid) {
        alert(check.reason)
        return this
    }

    /** 
     * daha sonra göndereceği veriyi HTML dökümanından alıp
     * request oluşturması için makeRequest fonksiyonuna gönderiyor
     */
    let data = {}
    data.title = titleInpt.value
    data.content = contentInpt.value
    makeRequest({
        data: JSON.stringify(data),
        method: 'POST',
        expectedStatus: 200
    })
}
/**
 * XMLHttpRequest object'i aracılığıyla server'a request gönderiyor
 */
function makeRequest({ data, method, expectedStatus }) {
    let xhr = new XMLHttpRequest()

    if (!xhr) {
        alert('Cannot create XMLHttpRequest instance :(')
        return false
    }

    /**
     * Bu event Request durum değiştirdiğinde teikleniyor ve
     * ona atadığımız fonksiyon server'dan response alındığında 
     * çalışıyor
     */
    xhr.onreadystatechange = () => {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === expectedStatus) {
                if (method === 'DELETE') {
                    /**
                     * Eğer sonuçlanan Request DELETE metodu ise
                     * ve olumlu sonuçlanmışsa html sayfasındaki ilgili alan
                     * da siliniyor
                     */
                    let child = document.getElementById(JSON.parse(data).id)
                    child.parentElement.removeChild(child)
                } else if (method === 'PUT') {
                    /**
                     * Eğer request PUT ise ve olumlu sonuçlandıysa
                     * html sayfasındaki alan güncelleniyor
                     */
                    let child = document.getElementById(JSON.parse(data).id)
                    let updatedData = JSON.parse(xhr.responseText)[0]
                    child.childNodes[0].textContent = updatedData.title
                    child.childNodes[2].textContent = updatedData.content
                } else {
                    /**
                     * diğer iki request'in sonucu (GET ve POST) aşağıdaki
                     * fonksiyonda belirleniyor 
                     */
                    handleResponseData(xhr.responseText)
                }
            }
        }
    }

    // Burada Request göndermek için bağlantı açılıyor ve
    xhr.open(method, url, true)
    // Header'lar veriliyor
    xhr.setRequestHeader('Content-Type', 'application/json')
    xhr.setRequestHeader('Cache-Control', 'no-cache')
    // Ve veri gönderiliyor
    xhr.send(data)
}
/**
 * GET ve POST Request'i işleyen fonksiyon
 */
async function handleResponseData(data) {
    console.log(data)
    let obj = JSON.parse(data)
    if (!obj) {
        console.log('Could not parse data!')
        return
    }
    let check = true
    obj.forEach(e => {
        if (!e.id || !e.title || !e.content || !e.created) {
            check = false
        }
    })
    if (check) {
        /**
         * Buraya kadar veriyi parse ediyor ve kontrol ediyor
         * ardından updateUI fonksiyonuna gönderiyor ve 
         * Gerekli alanı güncelliyor
         */
        obj.forEach(e => {
            updateUI(e)
        })
    }
}
/**
 * Yeni gelen veriler için Notlar alanını güncelliyor
 */
function updateUI({ id, title, content, created }) {
    let li = document.createElement('li')
    li.id = id
    li.innerHTML = `<span class="li-title">${title}</span>&nbsp;&nbsp;&nbsp;&nbsp;
    <p>${content}</p>&nbsp;&nbsp;&nbsp;&nbsp;
    <span class="li-time">${created}</span><br/>
    <button class="delete" id="dl${id}"></button>&nbsp;
    <button class="update" id="up${id}"></button>`
    listEl.insertBefore(li, listEl.firstElementChild)

    document.getElementById(`dl${id}`).addEventListener('click', deleteNote)
    document.getElementById(`up${id}`).addEventListener('click', updateNote)
}
/**
 * Bu alanlar notlar üzerindeki sil ve güncelle butonları
 * Veriyi silmek için Request gönderiyor
 */
function deleteNote(event) {
    let id = event.target.id.substring(2)
    makeRequest({
        method: 'DELETE',
        expectedStatus: 200,
        data: JSON.stringify({ id: id })
    })
}
/**
 * Veriyi güncellemek için "Create Note" kısmını "Update Note" kısmına
 * dönüştürüyor ve güncelleme yapabilecek butonu ve requesti ekliyor
 */
function updateNote(event) {
    let id = event.target.id.substring(2)
    let li = document.getElementById(id)
    let updateNoteBtn = document
        .createElement('button')
    updateNoteBtn.textContent = 'Update'
    updateNoteBtn.id = 'updateNode'
    let cancelBtn = document
        .createElement('button')
    cancelBtn.textContent = 'Cancel'
    cancelBtn.id = 'cancel'
    titleInpt.value = li.childNodes[0].textContent
    contentInpt.value = li.childNodes[2].textContent
    createNoteBtn.parentElement.appendChild(updateNoteBtn)
    createNoteBtn.parentElement.appendChild(cancelBtn)
    createNoteBtn.hidden = true
    $('#createNoteH3').textContent = 'Update Note'
    /** 
     * Güncelleme butonunun click listener'ı aracılıgıyla
     * PUT request gönderiliyor
     */
    updateNoteBtn.addEventListener('click', () => {
        makeRequest({
            method: 'PUT',
            data: JSON.stringify({
                title: titleInpt.value,
                content: contentInpt.value,
                id: id
            }),
            expectedStatus: 200
        })
        removeBtns()
    })
    cancelBtn.addEventListener('click', removeBtns)
}
// Güncelleme için arayüzde yapılan değişim geri alınıyor
function removeBtns() {
    createNoteBtn.parentElement.removeChild($('#updateNode'))
    createNoteBtn.parentElement.removeChild($('#cancel'))
    createNoteBtn.hidden = false
    contentInpt.value = ''
    titleInpt.value = ''
    $('#createNoteH3').textContent = 'Create Note'
}
