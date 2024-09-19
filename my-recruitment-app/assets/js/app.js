document.addEventListener('DOMContentLoaded', () => {
    const loadJSON = async (file) => {
        const response = await fetch(file);
        return await response.json();
    };

    const renderCompanies = async () => {
        const companies = await loadJSON('data/companies.json');
        const companyList = document.getElementById('company-list');
        companies.forEach(company => {
            const row = document.createElement('tr');
            row.innerHTML = `<td>${company.id}</td><td><a href="company.html?id=${company.id}">${company.name}</a></td>`;
            companyList.appendChild(row);
        });
    };

    const renderJobs = async () => {
        const jobs = await loadJSON('data/jobs.json');
        const jobList = document.getElementById('job-list');
        jobs.forEach(job => {
            const row = document.createElement('tr');
            row.innerHTML = `<td>${job.id}</td><td><a href="job.html?id=${job.id}">${job.title}</a></td><td>${job.employmentType}</td><td>${job.clientCompany}</td><td>${job.status}</td>`;
            jobList.appendChild(row);
        });
    };

    const renderApplicants = async () => {
        const applicants = await loadJSON('data/applicants.json');
        const jobs = await loadJSON('data/jobs.json');
        const applicantList = document.getElementById('applicant-list');
        applicants.forEach(applicant => {
            const job = jobs.find(j => j.id === applicant.jobId);
            const row = document.createElement('tr');
            row.innerHTML = `<td>${applicant.id}</td><td><a href="applicant.html?id=${applicant.id}">${applicant.name}</a></td><td>${applicant.score}</td><td>${job ? job.title : 'N/A'}</td>`;
            applicantList.appendChild(row);
        });
    };

    const renderCompanyDetails = async () => {
        const companies = await loadJSON('data/companies.json');
        const jobs = await loadJSON('data/jobs.json');
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
        const jobs = await loadJSON('data/jobs.json');
        const urlParams = new URLSearchParams(window.location.search);
        const jobId = parseInt(urlParams.get('id'));
        const job = jobs.find(j => j.id === jobId);

        document.getElementById('job-title').textContent = job.title;
        document.getElementById('job-id').textContent = job.id;
        document.getElementById('employment-type').textContent = job.employmentType;
        document.getElementById('client-company').textContent = job.clientCompany;
        document.getElementById('status').textContent = job.status;
    };

    const renderApplicantDetails = async () => {
        const applicants = await loadJSON('data/applicants.json');
        const jobs = await loadJSON('data/jobs.json');
        const urlParams = new URLSearchParams(window.location.search);
        const applicantId = parseInt(urlParams.get('id'));
        const applicant = applicants.find(a => a.id === applicantId);
        const job = jobs.find(j => j.id === applicant.jobId);

        document.getElementById('applicant-name').textContent = applicant.name;
        document.getElementById('applicant-id').textContent = applicant.id;
        document.getElementById('applicant-email').textContent = applicant.email;
        document.getElementById('applicant-phone').textContent = applicant.phone;
        document.getElementById('applicant-score').textContent = applicant.score;
        document.getElementById('applied-job').textContent = job ? job.title : 'N/A';
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
