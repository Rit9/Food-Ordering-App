const ownerForm = document.querySelector('form');
var resid = document.querySelector('#resid');
var itemname = document.querySelector('#itemname');
var ingred1 = document.querySelector('#ingred1');
var ingred2 = document.querySelector('#ingred2');
var profileURL = document.querySelector('#profileURL');
var category = document.querySelector('#category');
var price = document.querySelector('#price');
var type = document.querySelector('select');

ownerForm.addEventListener('submit', (e) => {
    // e.preventDefault();

    resid = resid.value;
    itemname = itemname.value;
    ingred1 = ingred1.value;
    ingred2 = ingred2.value;
    profileURL = profileURL.value
    category = category.value;
    price = price.value;
    type = type.value;

    fetch(`/ownerappdata?resid=${resid}&itemname=${itemname}&ingred1=${ingred1}&ingred2=${ingred2}&profileURL=${profileURL}&category=${category}&price=${price}&type=${type}`);
    // .then((response) => {
    //     response.json();
    // });
})