document.addEventListener('DOMContentLoaded', () => {
    console.log('Script loaded in D:\\Anxiety\\frontend');
    const userSelectionSection = document.getElementById('user-selection');
    const individualWelcomeSection = document.getElementById('individual-welcome');
    const psychologistDashboardSection = document.getElementById('psychologist-dashboard');
    const userTypeButtons = document.querySelectorAll('.user-type-btn');
    const startAssessmentButton = document.querySelector('.start-assessment-btn');
    const moodOptions = document.querySelectorAll('.mood-option');
    const viewClientButton = document.querySelector('.view-client-btn');
    const assessmentForm = document.getElementById('assessment-form');
    const form = document.getElementById('assessment-form');
    const sections = document.querySelectorAll('.form-section');
    const nextButtons = document.querySelectorAll('.next-btn');
    const prevButtons = document.querySelectorAll('.prev-btn');
    const progress = document.querySelector('.progress');
    const individualResults = document.getElementById('individual-results');
    const psychologistResults = document.getElementById('psychologist-results');
    const loadingOverlay = document.querySelector('.loading-overlay');
    const playlistMessage = document.getElementById('playlist-message');
    const playlistLink = document.getElementById('playlist-link');

    let currentSection = 1;
    let userType = null;

    assessmentForm.style.display = 'none';
    individualResults.style.display = 'none';
    psychologistResults.style.display = 'none';

    userTypeButtons.forEach(button => {
        button.addEventListener('click', () => {
            userType = button.getAttribute('data-type');
            userSelectionSection.classList.remove('active');
            if (userType === 'individual') individualWelcomeSection.classList.add('active');
            else psychologistDashboardSection.classList.add('active');
        });
        button.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); button.click(); }
        });
    });

    moodOptions.forEach(option => {
        option.addEventListener('click', () => {
            moodOptions.forEach(opt => { opt.classList.remove('selected'); opt.setAttribute('aria-checked', 'false'); });
            option.classList.add('selected');
            option.setAttribute('aria-checked', 'true');
        });
        option.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); option.click(); }
        });
    });

    startAssessmentButton.addEventListener('click', () => {
        individualWelcomeSection.classList.remove('active');
        assessmentForm.style.display = 'block';
        showSection(1);
    });

    viewClientButton.addEventListener('click', () => {
        const clientSelect = document.getElementById('client-select');
        if (clientSelect.value) {
            psychologistDashboardSection.classList.remove('active');
            assessmentForm.style.display = 'block';
            showSection(1);
        } else alert('Please select a client to proceed!');
    });

    const updateProgress = () => {
        const totalSections = sections.length;
        const progressPercentage = (currentSection / totalSections) * 100;
        progress.style.width = `${progressPercentage}%`;
        progress.parentElement.setAttribute('aria-valuenow', progressPercentage);
    };

    const showSection = (sectionNumber) => {
        sections.forEach(section => {
            section.classList.remove('active');
            if (parseInt(section.getAttribute('data-section')) === sectionNumber) {
                section.classList.add('active');
                section.querySelector('h2').focus();
            }
        });
        currentSection = sectionNumber;
        updateProgress();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const likertScales = document.querySelectorAll('.likert-scale');
    likertScales.forEach(scale => {
        const options = scale.querySelectorAll('.option');
        options.forEach(option => {
            option.addEventListener('click', () => {
                options.forEach(opt => { opt.classList.remove('selected'); opt.setAttribute('aria-checked', 'false'); });
                option.classList.add('selected');
                option.setAttribute('aria-checked', 'true');
            });
            option.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); option.click(); }
            });
        });
    });

    nextButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (currentSection < sections.length) showSection(currentSection + 1);
        });
    });

    prevButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (currentSection > 1) showSection(currentSection - 1);
        });
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Form submit event triggered');
        loadingOverlay.classList.add('active');

        try {
            const formData = new FormData(form);
            const data = {};
            formData.forEach((value, key) => { data[key] = value; });
            console.log('Form data collected:', data);

            likertScales.forEach((scale, index) => {
                const selectedOption = scale.querySelector('.option.selected');
                if (selectedOption) data[`likert-${index}`] = selectedOption.getAttribute('data-value');
            });
            console.log('Data with Likert:', data);

            const response = await fetch('/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            console.log('Fetching /analyze with data:', data);
            const result = await response.json();

            const playlistResponse = await fetch(`/spotify/playlist?score=${result.anxietyScore}`);
            console.log('Fetching /spotify/playlist with score:', result.anxietyScore);
            const playlistData = await playlistResponse.json();

            if (userType === 'individual') {
                individualResults.querySelector('.meter-fill').style.width = `${result.anxietyScore}%`;
                individualResults.querySelector('.anxiety-summary p').textContent = getAnxietyLevel(result.anxietyScore);
                individualResults.querySelectorAll('.progress-circle')[0].style.background = `conic-gradient(#ffb3c6 0% ${result.emotionalScore}%, #e0e0e0 ${result.emotionalScore}% 100%)`;
                individualResults.querySelectorAll('.progress-circle')[1].style.background = `conic-gradient(#ffb3c6 0% ${result.sleepScore}%, #e0e0e0 ${result.sleepScore}% 100%)`;
                individualResults.querySelectorAll('.progress-circle')[2].style.background = `conic-gradient(#ffb3c6 0% ${result.mindfulnessScore}%, #e0e0e0 ${result.mindfulnessScore}% 100%)`;

                const recommendationsDiv = individualResults.querySelector('.recommendations');
                recommendationsDiv.innerHTML = '<h3>Personalized Recommendations</h3>';
                result.recommendations.forEach(rec => {
                    const p = document.createElement('p');
                    p.textContent = rec;
                    recommendationsDiv.appendChild(p);
                });

                if (playlistData.error) {
                    playlistMessage.textContent = "Couldn’t find a playlist. Try again later!";
                    playlistLink.style.display = 'none';
                } else {
                    playlistMessage.textContent = `Enjoy: ${playlistData.playlist_name}`;
                    playlistLink.href = playlistData.playlist_url;
                    playlistLink.textContent = 'Listen Now';
                    playlistLink.style.display = 'inline-block';
                }

                assessmentForm.style.display = 'none';
                individualResults.style.display = 'block';
                individualResults.classList.add('active');
            } else {
                psychologistResults.querySelector('.client-summary p').textContent = `Anxiety Level: ${getAnxietyLevel(result.anxietyScore)}`;
                psychologistResults.querySelectorAll('.progress-circle')[0].style.background = `conic-gradient(#ffb3c6 0% ${result.emotionalScore}%, #e0e0e0 ${result.emotionalScore}% 100%)`;
                psychologistResults.querySelectorAll('.progress-circle')[1].style.background = `conic-gradient(#ffb3c6 0% ${result.sleepScore}%, #e0e0e0 ${result.sleepScore}% 100%)`;
                psychologistResults.querySelectorAll('.progress-circle')[2].style.background = `conic-gradient(#ffb3c6 0% ${result.mindfulnessScore}%, #e0e0e0 ${result.mindfulnessScore}% 100%)`;

                const insightsDiv = psychologistResults.querySelector('.ai-insights');
                insightsDiv.innerHTML = '<h3>AI-Driven Insights</h3>';
                result.recommendations.forEach(rec => {
                    const p = document.createElement('p');
                    p.textContent = rec;
                    insightsDiv.appendChild(p);
                });

                assessmentForm.style.display = 'none';
                psychologistResults.style.display = 'block';
                psychologistResults.classList.add('active');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Something went wrong. Please try again.');
        } finally {
            loadingOverlay.classList.remove('active');
        }
    });

    function getAnxietyLevel(score) {
        if (score < 30) return 'Low';
        if (score < 70) return 'Moderate';
        return 'High';
    }

    const logAnxietyButton = document.querySelector('.log-anxiety-btn');
    const logMessage = document.querySelector('.log-message');
    logAnxietyButton.addEventListener('click', () => {
        const anxietyLevel = document.getElementById('anxiety-level').value;
        logMessage.textContent = `Logged! Your anxiety level today is ${anxietyLevel}/5. Keep tracking to see your progress! 🌟`;
    });

    const breathingButton = document.querySelector('.breathing-btn');
    const breathingCircle = document.querySelector('.breathing-circle');
    const breathingInstruction = document.querySelector('.breathing-instruction');
    breathingButton.addEventListener('click', () => {
        breathingCircle.classList.add('active');
        let phase = 0;
        const instructions = ['Inhale... 🌬️', 'Hold...', 'Exhale... 💨', 'Hold...'];
        breathingInstruction.textContent = instructions[phase];
        setInterval(() => {
            phase = (phase + 1) % 4;
            breathingInstruction.textContent = instructions[phase];
        }, 2000);
    });
});