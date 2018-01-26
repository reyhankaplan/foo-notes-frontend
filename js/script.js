const $ = document.querySelector.bind(document)

const url = 'http://127.0.0.1:8000'

const createNoteBtn = $('#createNote')
const titleInpt = $('#title')
const contentInpt = $('#content')
const listEl = $('#noteList')

addEventListener('load', e => {
    makeRequest({
        data: null,
        method: 'GET',
        expectedStatus: 200
    })
})
createNoteBtn.addEventListener('click', createNote)

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

function createNote() {
    let check = validateData()

    if (!check.valid) {
        alert(check.reason)
        return this
    }

    let data = {}
    data.title = titleInpt.value
    data.content = contentInpt.value
    makeRequest({
        data: JSON.stringify(data),
        method: 'POST',
        expectedStatus: 200
    })
}

function makeRequest({ data, method, expectedStatus }) {
    let xhr = new XMLHttpRequest()

    if (!xhr) {
        alert('Cannot create XMLHttpRequest instance :(')
        return false
    }

    xhr.onreadystatechange = () => {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === expectedStatus) {
                if (method === 'DELETE') {
                    let child = document.getElementById(JSON.parse(data).id)
                    child.parentElement.removeChild(child)
                } else if (method === 'PUT') {
                    let child = document.getElementById(JSON.parse(data).id)
                    let updatedData = JSON.parse(xhr.responseText)[0]
                    child.childNodes[0].textContent = updatedData.title
                    child.childNodes[2].textContent = updatedData.content
                } else {
                    handleResponseData(xhr.responseText)
                }
            }
        }
    }

    xhr.open(method, url, true)

    xhr.setRequestHeader('Content-Type', 'application/json')
    xhr.setRequestHeader('Cache-Control', 'no-cache')

    xhr.send(data)
}

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
        obj.forEach(e => {
            updateUI(e)
        })
    }
}

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
function deleteNote(event) {
    let id = event.target.id.substring(2)
    makeRequest({
        method: 'DELETE',
        expectedStatus: 200,
        data: JSON.stringify({ id: id })
    })
}

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

function removeBtns() {
    createNoteBtn.parentElement.removeChild($('#updateNode'))
    createNoteBtn.parentElement.removeChild($('#cancel'))
    createNoteBtn.hidden = false
    contentInpt.value = ''
    titleInpt.value = ''
    $('#createNoteH3').textContent = 'Create Note'
}
