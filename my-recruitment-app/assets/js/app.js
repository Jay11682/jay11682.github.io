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
