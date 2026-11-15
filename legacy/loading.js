document.addEventListener("DOMContentLoaded", () => {
    // HTML-এর প্রোগ্রেস বার এবং টেক্সট এলিমেন্ট খুঁজে বের করা
    const progressText = document.querySelector('.progress-text') || document.getElementById('progress-text');
    const progressBar = document.querySelector('.progress-bar-inner') || document.querySelector('.progress-bar');
    
    let progress = 0;
    
    // স্মুথ এবং ফাস্ট লোডিং অ্যানিমেশন (০ থেকে ১০০%)
    const loadingInterval = setInterval(() => {
        // র‍্যান্ডম স্পিডে প্রোগ্রেস বাড়বে যাতে রিয়েলিস্টিক লাগে
        progress += Math.floor(Math.random() * 5) + 2; 
        
        if (progress >= 100) {
            progress = 100;
            clearInterval(loadingInterval);
            
            // ১০০% হওয়ার পর হাফ সেকেন্ড ওয়েট করে সুন্দরভাবে হোমপেজে যাবে
            setTimeout(() => {
                document.body.style.opacity = '0';
                document.body.style.transition = 'opacity 0.5s ease';
                setTimeout(() => {
                    window.location.href = '/index.html';
                }, 500);
            }, 600);
        }

        // UI আপডেট করা
        if (progressText) progressText.innerText = `${progress}%`;
        if (progressBar) progressBar.style.width = `${progress}%`;
        
    }, 40); // স্পিড কন্ট্রোল
});