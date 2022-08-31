const addform = document.querySelector('#addform');
const subform = document.querySelector('#subform');
// var userid1 = document.querySelector('#user_id1');
// var itemid1 = document.querySelector('#item_id1');
// var userid2 = document.querySelector('#user_id2');
// var itemid2 = document.querySelector('#item_id2');

addform.addEventListener('submit', (e) => {
    e.preventDefault();

    // userid1 = userid1.value;
    // itemid1 = itemid1.value;

    // fetch(`/add?userid1=${userid1}&itemid1=${itemid1}`);
});

subform.addEventListener('submit', (e) => {
    e.preventDefault();

    // userid2 = userid2.value;
    // itemid2 = itemid2.value;

    // fetch(`/subtract?userid2=${userid2}&itemid2=${itemid2}`);
});