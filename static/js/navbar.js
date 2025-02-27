// Back to top button functionality
let mybutton = document.getElementById("topButton");

window.onscroll = function() {
    scrollFunction();
    updateTOCHighlight();
};

function scrollFunction() {
    if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
        mybutton.style.display = "block";
    } else {
        mybutton.style.display = "none";
    }
}

function topFunction() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Back to top button functionality
document.addEventListener('DOMContentLoaded', function() {
    let mybutton = document.getElementById("topButton");
    
    if (mybutton) {
        window.onscroll = function() {
            scrollFunction();
            updateTOCHighlight();
        };

        function scrollFunction() {
            if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
                mybutton.style.display = "block";
            } else {
                mybutton.style.display = "none";
            }
        }
    }
    
    // Initialize TOC highlight
    updateTOCHighlight();
});

// TOC highlight functionality
function updateTOCHighlight() {
    const tocLinks = document.querySelectorAll('.toc-list a');
    let current = '';
    
    document.querySelectorAll('section').forEach(section => {
        const sectionTop = section.offsetTop;
        if (window.pageYOffset >= sectionTop - 60) {
            current = section.getAttribute('id');
        }
    });

    tocLinks.forEach(link => {
        link.style.fontWeight = link.getAttribute('href').slice(1) === current ? 'bold' : 'normal';
    });
}

// Initialize TOC highlight on page load
document.addEventListener('DOMContentLoaded', function() {
    updateTOCHighlight();
});