document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('ideaForm');
    const topicInput = document.getElementById('topicInput');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const resultsContainer = document.getElementById('resultsContainer');
    const historyContainer = document.getElementById('historyContainer');

    // Load history on page load
    loadHistory();

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const topic = topicInput.value.trim();
        
        if (!topic) {
            alert('Please enter a topic');
            return;
        }

        // Show loading indicator
        loadingIndicator.style.display = 'block';
        resultsContainer.style.display = 'none';

        try {
            const response = await fetch('/api/process', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ input: topic })
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            displayResults(data.results);
            loadHistory(); // Reload history after successful processing
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while processing your request');
        } finally {
            // Hide loading indicator
            loadingIndicator.style.display = 'none';
            resultsContainer.style.display = 'grid';
        }
    });

    async function loadHistory() {
        try {
            const response = await fetch('/api/history');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const history = await response.json();
            displayHistory(history);
        } catch (error) {
            console.error('Error loading history:', error);
        }
    }

    function displayResults(results) {
        // Display Generation Agent results
        const generationResults = document.getElementById('generationResults');
        generationResults.innerHTML = formatArray(results.finalIdeas.map(idea => idea.originalIdea));

        // Display Reflection Agent results
        const reflectionResults = document.getElementById('reflectionResults');
        reflectionResults.innerHTML = formatReflectionResults(results.finalIdeas);

        // Display Ranking Agent results
        const rankingResults = document.getElementById('rankingResults');
        rankingResults.innerHTML = formatRankingResults(results.finalIdeas);

        // Display Evolution Agent results
        const evolutionResults = document.getElementById('evolutionResults');
        evolutionResults.innerHTML = formatEvolutionResults(results.finalIdeas);

        // Display Proximity Agent results
        const proximityResults = document.getElementById('proximityResults');
        proximityResults.innerHTML = formatProximityResults(results.finalIdeas);

        // Display Meta-review Agent results
        const metaReviewResults = document.getElementById('metaReviewResults');
        metaReviewResults.innerHTML = formatMetaReviewResults(results);
    }

    function displayHistory(history) {
        historyContainer.innerHTML = history.map(item => `
            <div class="history-item">
                <h3>${item.input}</h3>
                <p>Generated Ideas: ${formatArray(JSON.parse(item.generated_ideas))}</p>
                <p>Final Score: ${getFinalScore(item)}</p>
                <p class="timestamp">${new Date(item.created_at).toLocaleString()}</p>
            </div>
        `).join('');
    }

    function formatArray(array) {
        return array.map(item => `<div>• ${item}</div>`).join('');
    }

    function formatReflectionResults(ideas) {
        return ideas.map(idea => `
            <div>
                <strong>${idea.originalIdea}</strong><br>
                Feasibility: ${idea.criteria.feasibility}/10<br>
                Impact: ${idea.criteria.impact}/10<br>
                Overall Score: ${idea.criteria.overallScore}/10
            </div>
        `).join('<hr>');
    }

    function formatRankingResults(ideas) {
        return ideas.map(idea => `
            <div>
                <strong>${idea.originalIdea}</strong><br>
                Original Score: ${idea.originalScore}/10<br>
                Cost Score: ${idea.costScore}/10<br>
                Trend Score: ${idea.trendScore}/10<br>
                Final Score: ${idea.finalScore}/10
            </div>
        `).join('<hr>');
    }

    function formatEvolutionResults(ideas) {
        return ideas.map(idea => `
            <div>
                <strong>Original:</strong> ${idea.originalIdea}<br>
                <strong>Evolved:</strong> ${idea.evolvedIdea}<br>
                <strong>Improvement:</strong> +${idea.improvement}
            </div>
        `).join('<hr>');
    }

    function formatProximityResults(ideas) {
        return ideas.map(idea => `
            <div>
                <strong>Original:</strong> ${idea.originalIdea}<br>
                <strong>Enhanced:</strong> ${idea.enhancedIdea}<br>
                <strong>Historical Context:</strong> ${idea.historicalContext.length} similar ideas found
            </div>
        `).join('<hr>');
    }

    function formatMetaReviewResults(results) {
        return `
            <div>
                <strong>Performance Metrics:</strong><br>
                Total Time: ${results.performanceMetrics.totalTime}ms<br>
                <br>
                <strong>Bottlenecks:</strong><br>
                ${results.bottlenecks.map(b => `• ${b.agent}: ${b.details}`).join('<br>')}<br>
                <br>
                <strong>Suggestions:</strong><br>
                ${results.suggestions.map(s => `• ${s.target}: ${s.suggestion}`).join('<br>')}
            </div>
        `;
    }

    function getFinalScore(item) {
        try {
            const metaReview = JSON.parse(item.meta_review);
            return metaReview.finalIdeas[0]?.evolvedScore || 'N/A';
        } catch (error) {
            return 'N/A';
        }
    }
}); 