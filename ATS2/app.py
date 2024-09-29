from flask import Flask, render_template, request, redirect, url_for, session, abort, flash
from flask_sqlalchemy import SQLAlchemy
from datetime import date
from sqlalchemy import func

app = Flask(__name__)
app.secret_key = 'your_secret_key'  # Replace with a secure key in production
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///ats.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Initialize the sidebar in the session
@app.before_request
def before_request():
    if 'sidebar' not in session:
        session['sidebar'] = []

# Helper function to add items to the sidebar
def add_to_sidebar(name, endpoint, item_type, **kwargs):
    url = url_for(endpoint, **kwargs)
    # Check if the item already exists
    if not any(item['url'] == url for item in session['sidebar']):
        # Store the endpoint and type in the item
        session['sidebar'].append({'name': name, 'url': url, 'endpoint': endpoint, 'type': item_type})
        session.modified = True  # Mark the session as modified to save changes

# Models
class Company(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    website = db.Column(db.String(255))
    jobs = db.relationship('Job', backref='company', lazy=True)
    contacts = db.relationship('Contact', backref='company', lazy=True)

class Job(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    status = db.Column(db.String(50), nullable=False, default='Accepting Candidates')
    employment = db.Column(db.String(50), nullable=False, default='Permanent')
    company_id = db.Column(db.Integer, db.ForeignKey('company.id'), nullable=True)
    applications = db.relationship('Application', backref='job', lazy=True)

class Candidate(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    phone = db.Column(db.String(20))
    status = db.Column(db.String(50), nullable=False, default='New Lead')
    current_company = db.Column(db.String(100))
    title = db.Column(db.String(100))
    last_edit = db.Column(db.Date, default=date.today, onupdate=date.today)
    applications = db.relationship('Application', backref='candidate', lazy=True)

class Application(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    candidate_id = db.Column(db.Integer, db.ForeignKey('candidate.id'), nullable=False)
    job_id = db.Column(db.Integer, db.ForeignKey('job.id'), nullable=False)
    application_date = db.Column(db.Date, default=date.today)
    
    __table_args__ = (db.UniqueConstraint('candidate_id', 'job_id', name='_candidate_job_uc'),)


class Contact(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100))
    phone = db.Column(db.String(20))
    company_id = db.Column(db.Integer, db.ForeignKey('company.id'), nullable=True)

# Routes

@app.route('/')
def index():
    # Get counts
    total_candidates = Candidate.query.count()
    total_jobs = Job.query.count()
    total_companies = Company.query.count()
    total_applications = Application.query.count()

    # Candidates by Status
    candidate_status_counts = db.session.query(
        Candidate.status, func.count(Candidate.id)
    ).group_by(Candidate.status).all()
    candidate_status_labels = [status for status, count in candidate_status_counts]
    candidate_status_data = [count for status, count in candidate_status_counts]

    # Jobs by Status
    job_status_counts = db.session.query(
        Job.status, func.count(Job.id)
    ).group_by(Job.status).all()
    job_status_labels = [status for status, count in job_status_counts]
    job_status_data = [count for status, count in job_status_counts]

    # Applications Over Time (Last 30 days) - **Removed**
    # If you decide to keep it in the future, ensure proper formatting

    # Recent Activities (e.g., last 5 applications)
    recent_applications = Application.query.order_by(
        Application.application_date.desc()
    ).limit(5).all()

    # Format recent activities
    recent_activities = [
        {
            'application_date': app.application_date.strftime('%m/%d/%Y'),
            'candidate_name': f"{app.candidate.first_name} {app.candidate.last_name}",
            'candidate_id': app.candidate.id,
            'job_title': app.job.title,
            'job_id': app.job.id
        }
        for app in recent_applications
    ]

    return render_template(
        'index.html',
        total_candidates=total_candidates,
        total_jobs=total_jobs,
        total_companies=total_companies,
        total_applications=total_applications,
        candidate_status_labels=candidate_status_labels,
        candidate_status_data=candidate_status_data,
        job_status_labels=job_status_labels,
        job_status_data=job_status_data,
        recent_activities=recent_activities
    )

# Candidates
@app.route('/candidates', methods=['GET', 'POST'])
def candidates():
    search_query = request.args.get('search', '').strip()
    if search_query:
        candidates = Candidate.query.filter(
            Candidate.id.like(f"%{search_query}%") |
            Candidate.first_name.like(f"%{search_query}%") |
            Candidate.last_name.like(f"%{search_query}%") |
            Candidate.email.like(f"%{search_query}%") |
            Candidate.phone.like(f"%{search_query}%") |
            Candidate.status.like(f"%{search_query}%") |
            Candidate.current_company.like(f"%{search_query}%") |
            Candidate.title.like(f"%{search_query}%")
        ).all()
    else:
        candidates = Candidate.query.all()
    add_to_sidebar('Candidate List', 'candidates', 'candidate')
    return render_template('candidates.html', candidates=candidates, search_query=search_query)


@app.route('/candidate/<int:candidate_id>')
def candidate_detail(candidate_id):
    candidate = Candidate.query.get_or_404(candidate_id)
    name = f"{candidate.first_name} {candidate.last_name}"
    add_to_sidebar(name, 'candidate_detail', 'candidate', candidate_id=candidate_id)
    return render_template('candidate_detail.html', candidate=candidate)

@app.route('/add_candidate', methods=['GET', 'POST'])
def add_candidate():
    statuses = ['New Lead', 'Warm', 'Available', 'Placed by Us', 'Placed by Competitor', 'On Hold', 'Do Not Hire']
    if request.method == 'POST':
        candidate = Candidate(
            first_name=request.form['first_name'],
            last_name=request.form['last_name'],
            email=request.form['email'],
            phone=request.form['phone'],
            status=request.form['status'],
            current_company=request.form['current_company'],
            title=request.form['title'],
            last_edit=date.today()
        )
        db.session.add(candidate)
        db.session.commit()
        return redirect(url_for('candidates'))
    return render_template('add_candidate.html', statuses=statuses)

@app.route('/edit_candidate/<int:candidate_id>', methods=['GET', 'POST'])
def edit_candidate(candidate_id):
    candidate = Candidate.query.get_or_404(candidate_id)
    statuses = ['New Lead', 'Warm', 'Available', 'Placed by Us', 'Placed by Competitor', 'On Hold', 'Do Not Hire']
    if request.method == 'POST':
        candidate.first_name = request.form['first_name']
        candidate.last_name = request.form['last_name']
        candidate.email = request.form['email']
        candidate.phone = request.form['phone']
        candidate.status = request.form['status']
        candidate.current_company = request.form['current_company']
        candidate.title = request.form['title']
        candidate.last_edit = date.today()
        db.session.commit()
        return redirect(url_for('candidate_detail', candidate_id=candidate.id))
    return render_template('edit_candidate.html', candidate=candidate, statuses=statuses)

@app.route('/delete_candidate/<int:candidate_id>', methods=['POST'])
def delete_candidate(candidate_id):
    candidate = Candidate.query.get_or_404(candidate_id)
    db.session.delete(candidate)
    db.session.commit()
    # Remove the candidate from the sidebar if it's there
    session['sidebar'] = [item for item in session['sidebar'] if item['url'] != url_for('candidate_detail', candidate_id=candidate_id)]
    session.modified = True
    return redirect(url_for('candidates'))

@app.route('/update_candidate_field', methods=['POST'])
def update_candidate_field():
    data = request.get_json()
    candidate_id = data.get('id')
    field = data.get('field')
    value = data.get('value')

    candidate = Candidate.query.get(candidate_id)
    if candidate:
        if field == 'status':
            candidate.status = value
            # Add any necessary validation
        # Handle other fields if necessary
        db.session.commit()
        return jsonify({'success': True})
    else:
        return jsonify({'success': False, 'message': 'Candidate not found'}), 404

# Jobs
@app.route('/jobs', methods=['GET', 'POST'])
def jobs():
    search_query = request.args.get('search', '').strip()
    if search_query:
        jobs = Job.query.join(Company, isouter=True).filter(
            Job.id.like(f"%{search_query}%") |
            Job.title.like(f"%{search_query}%") |
            Job.status.like(f"%{search_query}%") |
            Job.employment.like(f"%{search_query}%") |
            Company.name.like(f"%{search_query}%")
        ).all()
    else:
        jobs = Job.query.all()
    add_to_sidebar('Job List', 'jobs', 'job')
    return render_template('jobs.html', jobs=jobs, search_query=search_query)


@app.route('/job/<int:job_id>')
def job_detail(job_id):
    job = Job.query.get_or_404(job_id)
    add_to_sidebar(job.title, 'job_detail', 'job', job_id=job_id)
    return render_template('job_detail.html', job=job)

@app.route('/add_job', methods=['GET', 'POST'])
def add_job():
    companies = Company.query.all()
    statuses = ['Placed', 'Accepting Candidates', 'Closed']
    employments = ['Permanent', 'Temporary', 'Direct Hire', 'Contract', 'Contract to Hire']
    if request.method == 'POST':
        job = Job(
            title=request.form['title'],
            description=request.form['description'],
            status=request.form['status'],
            employment=request.form['employment'],
            company_id=request.form['company_id']
        )
        db.session.add(job)
        db.session.commit()
        return redirect(url_for('jobs'))
    return render_template('add_job.html', companies=companies, statuses=statuses, employments=employments)

@app.route('/edit_job/<int:job_id>', methods=['GET', 'POST'])
def edit_job(job_id):
    job = Job.query.get_or_404(job_id)
    statuses = ['Placed', 'Accepting Candidates', 'Closed']
    employments = ['Permanent', 'Temporary', 'Direct Hire', 'Contract', 'Contract to Hire']
    if request.method == 'POST':
        job.title = request.form['title']
        job.status = request.form['status']
        job.employment = request.form['employment']
        db.session.commit()
        return redirect(url_for('job_detail', job_id=job.id))
    return render_template('edit_job.html', job=job, statuses=statuses, employments=employments)

@app.route('/delete_job/<int:job_id>', methods=['POST'])
def delete_job(job_id):
    job = Job.query.get_or_404(job_id)
    db.session.delete(job)
    db.session.commit()
    # Remove the job from the sidebar if it's there
    session['sidebar'] = [item for item in session['sidebar'] if item['url'] != url_for('job_detail', job_id=job_id)]
    session.modified = True
    return redirect(url_for('jobs'))


# Companies
@app.route('/companies', methods=['GET', 'POST'])
def companies():
    search_query = request.args.get('search', '').strip()
    if search_query:
        companies = Company.query.filter(
            Company.id.like(f"%{search_query}%") |
            Company.name.like(f"%{search_query}%") |
            Company.website.like(f"%{search_query}%")
        ).all()
    else:
        companies = Company.query.all()
    add_to_sidebar('Company List', 'companies', 'company')
    return render_template('companies.html', companies=companies, search_query=search_query)


@app.route('/company/<int:company_id>')
def company_detail(company_id):
    company = Company.query.get_or_404(company_id)
    add_to_sidebar(company.name, 'company_detail', 'company', company_id=company_id)
    return render_template('company_detail.html', company=company)

@app.route('/add_company', methods=['GET', 'POST'])
def add_company():
    if request.method == 'POST':
        company = Company(
            name=request.form['name'],
            website=request.form['website']
        )
        db.session.add(company)
        db.session.commit()
        return redirect(url_for('companies'))
    return render_template('add_company.html')

@app.route('/edit_company/<int:company_id>', methods=['GET', 'POST'])
def edit_company(company_id):
    company = Company.query.get_or_404(company_id)
    if request.method == 'POST':
        company.name = request.form['name']
        company.website = request.form['website']
        db.session.commit()
        return redirect(url_for('company_detail', company_id=company.id))
    return render_template('edit_company.html', company=company)

@app.route('/delete_company/<int:company_id>', methods=['POST'])
def delete_company(company_id):
    company = Company.query.get_or_404(company_id)
    db.session.delete(company)
    db.session.commit()
    # Remove the company from the sidebar if it's there
    session['sidebar'] = [item for item in session['sidebar'] if item['url'] != url_for('company_detail', company_id=company_id)]
    session.modified = True
    return redirect(url_for('companies'))

# Contacts
@app.route('/contacts', methods=['GET', 'POST'])
def contacts():
    search_query = request.args.get('search', '').strip()
    if search_query:
        contacts = Contact.query.join(Company, isouter=True).filter(
            Contact.id.like(f"%{search_query}%") |
            Contact.name.like(f"%{search_query}%") |
            Contact.email.like(f"%{search_query}%") |
            Contact.phone.like(f"%{search_query}%") |
            Company.name.like(f"%{search_query}%")
        ).all()
    else:
        contacts = Contact.query.all()
    add_to_sidebar('Contact List', 'contacts', 'contact')
    return render_template('contacts.html', contacts=contacts, search_query=search_query)


@app.route('/contact/<int:contact_id>')
def contact_detail(contact_id):
    contact = Contact.query.get_or_404(contact_id)
    add_to_sidebar(contact.name, 'contact_detail', 'contact', contact_id=contact_id)
    return render_template('contact_detail.html', contact=contact)

@app.route('/add_contact', methods=['GET', 'POST'])
def add_contact():
    companies = Company.query.all()
    if request.method == 'POST':
        contact = Contact(
            name=request.form['name'],
            email=request.form['email'],
            phone=request.form['phone'],
            company_id=request.form['company_id']
        )
        db.session.add(contact)
        db.session.commit()
        return redirect(url_for('contacts'))
    return render_template('add_contact.html', companies=companies)

@app.route('/edit_contact/<int:contact_id>', methods=['GET', 'POST'])
def edit_contact(contact_id):
    contact = Contact.query.get_or_404(contact_id)
    companies = Company.query.all()
    if request.method == 'POST':
        contact.name = request.form['name']
        contact.email = request.form['email']
        contact.phone = request.form['phone']
        contact.company_id = request.form['company_id']
        db.session.commit()
        return redirect(url_for('contact_detail', contact_id=contact.id))
    return render_template('edit_contact.html', contact=contact, companies=companies)


@app.route('/delete_contact/<int:contact_id>', methods=['POST'])
def delete_contact(contact_id):
    contact = Contact.query.get_or_404(contact_id)
    db.session.delete(contact)
    db.session.commit()
    # Remove the contact from the sidebar if it's there
    session['sidebar'] = [item for item in session['sidebar'] if item['url'] != url_for('contact_detail', contact_id=contact_id)]
    session.modified = True
    return redirect(url_for('contacts'))

# Route to remove an item from the sidebar
@app.route('/remove_sidebar_item', methods=['POST'])
def remove_sidebar_item():
    url = request.form.get('url')
    current_url = request.form.get('current_url')
    if url:
        # Remove the item from the sidebar
        sidebar = session.get('sidebar', [])
        # Find the index of the item being removed
        item_index = next((i for i, item in enumerate(sidebar) if item['url'] == url), None)
        if item_index is not None:
            del sidebar[item_index]
            session['sidebar'] = sidebar
            session.modified = True
            # If the current page is the one being removed, redirect appropriately
            if current_url == url:
                # Get the item above in the sidebar
                if item_index > 0:
                    new_url = sidebar[item_index - 1]['url']
                    return redirect(new_url)
                elif sidebar:
                    # If there are other items in the sidebar, redirect to the first one
                    new_url = sidebar[0]['url']
                    return redirect(new_url)
                else:
                    # Sidebar is empty, redirect to home page
                    return redirect(url_for('index'))
            else:
                # Current page is not being removed, stay on current page
                return redirect(current_url or request.referrer or url_for('index'))
        else:
            # Item not found in sidebar
            return redirect(current_url or request.referrer or url_for('index'))
    else:
        abort(400)

# Function to initialize the database and add sample data
def initialize_database():
    db.create_all()
    if not Company.query.first():
        # Add sample companies
        company1 = Company(name='OpenAI', website='https://www.openai.com')
        company2 = Company(name='TechCorp', website='https://www.techcorp.com')
        db.session.add_all([company1, company2])
        db.session.commit()

        # Add sample jobs
        job1 = Job(
            title='Software Engineer',
            description='Develop and maintain software applications.',
            status='Accepting Candidates',
            employment='Permanent',
            company_id=company1.id
        )
        job2 = Job(
            title='Data Analyst',
            description='Analyze data to support business decisions.',
            status='Accepting Candidates',
            employment='Contract',
            company_id=company2.id
        )
        db.session.add_all([job1, job2])
        db.session.commit()

        # Add sample candidates
        candidate1 = Candidate(
            first_name='Alice',
            last_name='Smith',
            email='alice.smith@example.com',
            phone='555-1234',
            status='Available',
            current_company='Acme Corp',
            title='Software Developer',
            last_edit=date.today()
        )
        candidate2 = Candidate(
            first_name='Bob',
            last_name='Johnson',
            email='bob.johnson@example.com',
            phone='555-5678',
            status='New Lead',
            current_company='Global Tech',
            title='Data Analyst',
            last_edit=date.today()
        )
        db.session.add_all([candidate1, candidate2])
        db.session.commit()

        # Add sample applications
        application1 = Application(candidate_id=candidate1.id, job_id=job1.id)
        application2 = Application(candidate_id=candidate2.id, job_id=job2.id)
        db.session.add_all([application1, application2])
        db.session.commit()

        # Add sample contacts
        contact1 = Contact(name='Carol Williams', email='carol.williams@openai.com', phone='555-8765', company_id=company1.id)
        contact2 = Contact(name='David Brown', email='david.brown@techcorp.com', phone='555-4321', company_id=company2.id)
        db.session.add_all([contact1, contact2])
        db.session.commit()

if __name__ == '__main__':
    with app.app_context():
        initialize_database()
    app.run(debug=True)