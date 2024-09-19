document.addEventListener('DOMContentLoaded', () => {
    const loadJSON = async (file) => {
        const response = await fetch(file);
        return await response.json();
    };

    const renderCompanies = async () => {
        const companies = await loadJSON('data/companies.json');
        const companyList = document.getElementById('company-list');
        companies.forEach(company => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `<a href="company.html?id=${company.id}">${company.name}</a>`;
            companyList.appendChild(listItem);
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
        document.getElementById('company-metadata').textContent = company.metadata;

        const jobList = document.getElementById('job-list');
        companyJobs.forEach(job => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `<a href="job.html?id=${job.id}">${job.title}</a> - ${job.status}`;
            jobList.appendChild(listItem);
        });
    };

    const renderJobDetails = async () => {
        const jobs = await loadJSON('data/jobs.json');
        const applicants = await loadJSON('data/applicants.json');
        const urlParams = new URLSearchParams(window.location.search);
        const jobId = parseInt(urlParams.get('id'));
        const job = jobs.find(j => j.id === jobId);
        const jobApplicants = applicants.filter(a => a.jobId === jobId);

        document.getElementById('job-title').textContent = job.title;
        document.getElementById('job-status').textContent = job.status;

        const applicantList = document.getElementById('applicant-list');
        jobApplicants.forEach(applicant => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `<a href="applicant.html?id=${applicant.id}">${applicant.name}</a> - Score: ${applicant.score}`;
            applicantList.appendChild(listItem);
        });
    };

    const renderApplicantDetails = async () => {
        const applicants = await loadJSON('data/applicants.json');
        const jobs = await loadJSON('data/jobs.json');
        const urlParams = new URLSearchParams(window.location.search);
        const applicantId = parseInt(urlParams.get('id'));
        const applicant = applicants.find(a => a.id === applicantId);
        const appliedJobs = jobs.filter(j => j.id === applicant.jobId);

        document.getElementById('applicant-name').textContent = applicant.name;
        document.getElementById('applicant-email').textContent = applicant.email;
        document.getElementById('applicant-phone').textContent = applicant.phone;

        const appliedJobsList = document.getElementById('applied-jobs-list');
        appliedJobs.forEach(job => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `<a href="job.html?id=${job.id}">${job.title}</a> - Score: ${applicant.score}`;
            appliedJobsList.appendChild(listItem);
        });
    };

    if (document.getElementById('company-list')) {
        renderCompanies();
    }

    if (document.getElementById('company-name')) {
        renderCompanyDetails();
    }

    if (document.getElementById('job-title')) {
        renderJobDetails();
    }

    if (document.getElementById('applicant-name')) {
        renderApplicantDetails();
    }
});
