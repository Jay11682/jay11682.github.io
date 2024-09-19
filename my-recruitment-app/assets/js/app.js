document.addEventListener('DOMContentLoaded', () => {
    const loadJSON = async (file) => {
        const response = await fetch(file);
        return await response.json();
    };

    const createSortableTable = (tableId) => {
        const table = document.getElementById(tableId);
        const headers = table.querySelectorAll('th');
        let sortDirection = 1;

        headers.forEach((header, index) => {
            header.addEventListener('click', () => {
                const rows = Array.from(table.querySelector('tbody').rows);
                const isNumeric = !isNaN(rows[0].cells[index].innerText);
                
                rows.sort((rowA, rowB) => {
                    const cellA = rowA.cells[index].innerText;
                    const cellB = rowB.cells[index].innerText;
                    
                    if (isNumeric) {
                        return sortDirection * (parseInt(cellA) - parseInt(cellB));
                    } else {
                        return sortDirection * cellA.localeCompare(cellB);
                    }
                });

                rows.forEach(row => table.querySelector('tbody').appendChild(row));

                sortDirection *= -1;
            });
        });
    };

    const renderCompanies = async () => {
        const companies = await loadJSON('data/consistent_companies.json');
        const companyList = document.getElementById('company-list');
        companies.forEach(company => {
            const row = document.createElement('tr');
            row.innerHTML = `<td>${company.id}</td><td><a href="company.html?id=${company.id}">${company.name}</a></td>`;
            companyList.appendChild(row);
        });
        createSortableTable('company-table');
    };

    const renderJobs = async () => {
        const jobs = await loadJSON('data/consistent_jobs.json');
        const jobList = document.getElementById('job-list');
        jobs.forEach(job => {
            const row = document.createElement('tr');
            row.innerHTML = `<td>${job.id}</td><td><a href="job.html?id=${job.id}">${job.title}</a></td><td>${job.employmentType}</td><td><a href="company.html?id=${job.companyId}">${job.clientCompany}</a></td><td>${job.status}</td>`;
            jobList.appendChild(row);
        });
        createSortableTable('job-table');
    };

    const renderApplicants = async () => {
        const applicants = await loadJSON('data/consistent_applicants.json');
        const jobs = await loadJSON('data/consistent_jobs.json');
        const applicantList = document.getElementById('applicant-list');
        applicants.forEach(applicant => {
            const job = jobs.find(j => j.id === applicant.jobId);
            const row = document.createElement('tr');
            row.innerHTML = `<td>${applicant.id}</td><td><a href="applicant.html?id=${applicant.id}">${applicant.name}</a></td><td>${applicant.score}</td><td><a href="job.html?id=${job.id}">${job.title}</a></td>`;
            applicantList.appendChild(row);
        });
        createSortableTable('applicant-table');
    };

    const renderCompanyDetails = async () => {
        const companies = await loadJSON('data/consistent_companies.json');
        const jobs = await loadJSON('data/consistent_jobs.json');
        const urlParams = new URLSearchParams(window.location.search);
        const companyId = parseInt(urlParams.get('id'));
        const company = companies.find(c => c.id === companyId);
        const companyJobs = jobs.filter(j => j.companyId === companyId);

        document.getElementById('company-name').textContent = company.name;
        document.getElementById('company-name-small').textContent = company.name;

        const jobList = document.getElementById('company-jobs-list');
        companyJobs.forEach(job => {
            const row = document.createElement('tr');
            row.innerHTML = `<td>${job.id}</td><td><a href="job.html?id=${job.id}">${job.title}</a></td><td>${job.employmentType}</td><td>${job.status}</td>`;
            jobList.appendChild(row);
        });
    };

    const renderJobDetails = async () => {
        const jobs = await loadJSON('data/consistent_jobs.json');
        const applicants = await loadJSON('data/consistent_applicants.json');
        const urlParams = new URLSearchParams(window.location.search);
        const jobId = parseInt(urlParams.get('id'));
        const job = jobs.find(j => j.id === jobId);
        const jobApplicants = applicants.filter(a => a.jobId === jobId);

        document.getElementById('job-title').textContent = job.title;
        document.getElementById('job-id').textContent = job.id;
        document.getElementById('employment-type').textContent = job.employmentType;
        document.getElementById('client-company').textContent = job.clientCompany;
        document.getElementById('status').textContent = job.status;

        document.getElementById('client-company-link').href = `company.html?id=${job.companyId}`;

        const applicantList = document.getElementById('job-applicants-list');
        jobApplicants.forEach(applicant => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `<a href="applicant.html?id=${applicant.id}">${applicant.name}</a> (Score: ${applicant.score})`;
            applicantList.appendChild(listItem);
        });
    };

    const renderApplicantDetails = async () => {
        const applicants = await loadJSON('data/consistent_applicants.json');
        const jobs = await loadJSON('data/consistent_jobs.json');
        const urlParams = new URLSearchParams(window.location.search);
        const applicantId = parseInt(urlParams.get('id'));
        const applicant = applicants.find(a => a.id === applicantId);
        const appliedJobs = jobs.filter(j => j.id === applicant.jobId);

        document.getElementById('applicant-name').textContent = applicant.name;
        document.getElementById('applicant-id').textContent = applicant.id;
        document.getElementById('applicant-email').textContent = applicant.email;
        document.getElementById('applicant-phone').textContent = applicant.phone;
        document.getElementById('applicant-score').textContent = applicant.score;

        const jobList = document.getElementById('applicant-jobs-list');
        appliedJobs.forEach(job => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `<a href="job.html?id=${job.id}">${job.title}</a>`;
            jobList.appendChild(listItem);
        });
    };

    if (document.getElementById('company-list')) {
        renderCompanies();
    }

    if (document.getElementById('job-list')) {
        renderJobs();
    }

    if (document.getElementById('applicant-list')) {
        renderApplicants();
    }

    if (document.getElementById('company-jobs-list')) {
        renderCompanyDetails();
    }

    if (document.getElementById('job-details-list')) {
        renderJobDetails();
    }

    if (document.getElementById('applicant-details-list')) {
        renderApplicantDetails();
    }
});
