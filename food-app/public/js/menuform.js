const menuForm = document.querySelector('form');
var resid = document.querySelector('#hotel_id');
var userid = document.querySelector('#user_id');
var item1id = document.querySelector('#item1_id');
var item1qty = document.querySelector('#item1_quantity');
var item2id = document.querySelector('#item2_id');
var item2qty = document.querySelector('#item2_quantity');
var item3id = document.querySelector('#item3_id');
var item3qty = document.querySelector('#item3_quantity');

menuForm.addEventListener('submit', (e) => {
    // e.preventDefault();

    resid = resid.value;
    userid = userid.value;
    item1id = item1id.value;
    item1qty = item1qty.value;
    item2id = item2id.value
    item2qty = item2qty.value;
    item3id = item3id.value;
    item3qty = item3qty.value;

    fetch(`/menuformdata?resid=${resid}&userid=${userid}&item1id=${item1id}&item1qty=${item1qty}&item2id=${item2id}&item2qty=${item2qty}&item3id=${item3id}&item3qty=${item3qty}`);
    // .then((response) => {
    //     response.json();
    // });
});