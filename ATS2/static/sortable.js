// static/sortable.js

document.addEventListener('DOMContentLoaded', function () {
    const getCellValue = (tr, idx) => tr.children[idx].innerText || tr.children[idx].textContent;

    const comparer = function (idx, asc) {
        return function (a, b) {
            const v1 = getCellValue(asc ? a : b, idx);
            const v2 = getCellValue(asc ? b : a, idx);
            return v1.localeCompare(v2, undefined, {numeric: true});
        };
    };

    document.querySelectorAll('th.sortable').forEach(function (th) {
        th.addEventListener('click', function () {
            const table = th.closest('table');
            const tbody = table.querySelector('tbody');
            Array.from(tbody.querySelectorAll('tr'))
                .sort(comparer(Array.from(th.parentNode.children).indexOf(th), th.asc = !th.asc))
                .forEach(tr => tbody.appendChild(tr));

            // Remove sort indicators from other headers
            table.querySelectorAll('th.sortable').forEach(function (header) {
                if (header !== th) {
                    header.classList.remove('sorted-asc', 'sorted-desc');
                    header.asc = undefined;
                }
            });

            // Update sort indicator
            th.classList.toggle('sorted-asc', th.asc);
            th.classList.toggle('sorted-desc', !th.asc);
        });
    });
});
