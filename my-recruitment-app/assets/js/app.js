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
            listItem.innerHTML = `ID: ${company.id} - <a href="company.html?id=${company.id}">${company.name}</a>`;
            companyList.appendChild(listItem);
        });
    };

    const renderJobs = async () => {
        const jobs = await loadJSON('data/jobs.json');
        const jobList = document.getElementById('job-list');
        jobs.forEach(job => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `ID: ${job.id} - <a href="job.html?id=${job.id}">${job.title}</a> - ${job.status}`;
            jobList.appendChild(listItem);
        });
    };

    const renderApplicants = async () => {
        const applicants = await loadJSON('data/applicants.json');
        const jobs = await loadJSON('data/jobs.json');
        const applicantList = document.getElementById('applicant-list');
        applicants.forEach(applicant => {
            const job = jobs.find(j => j.id === applicant.jobId);
            const listItem = document.createElement('li');
            listItem.innerHTML = `ID: ${applicant.id} - <a href="applicant.html?id=${applicant.id}">${applicant.name}</a> - Score: ${applicant.score} - Job: ${job ? job.title : 'N/A'}`;
            applicantList.appendChild(listItem);
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
});
