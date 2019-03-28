'use strict';

window.addEventListener('load', function () {

    let links = document.querySelectorAll('#links');

    let performEvent = function (mouseEvent) {
        let a = mouseEvent.target;
        a.style.color = "orange";

    };

    let performOffEvent = function (mouseEvent) {
        let a = mouseEvent.target;
        a.style.color = "blue";

    };

    let performClickEvent = function (clickEvent) {
        let a = clickEvent.target;
        a.style.color = "skyblue";

    };

    for (let i = 0; links.length; i++) {
        let linkCell = links[i];
        linkCell.addEventListener("mouseover", performEvent);
        linkCell.addEventListener("mouseout", performOffEvent);
        linkCell.addEventListener("click", performClickEvent);
    }
});
