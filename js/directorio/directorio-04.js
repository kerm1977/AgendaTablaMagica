/* ARCHIVO: js/directorio/directorio-04.js */
        function lanzarConfetti() {
            const canvas = document.getElementById('confetti-canvas');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            const colores = ['#f97316', '#ea580c', '#25D366', '#2563eb', '#dc2626', '#facc15'];
            const piezas = Array.from({ length: 120 }, () => ({
                x: Math.random() * canvas.width,
                y: Math.random() * -canvas.height,
                w: 6 + Math.random() * 6,
                h: 8 + Math.random() * 8,
                color: colores[Math.floor(Math.random() * colores.length)],
                velY: 2 + Math.random() * 3,
                velX: -1 + Math.random() * 2,
                rot: Math.random() * 360,
                velRot: -6 + Math.random() * 12
            }));

            function frame() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                piezas.forEach(p => {
                    p.y += p.velY;
                    p.x += p.velX;
                    p.rot += p.velRot;
                    if (p.y > canvas.height) p.y = -20;
                    ctx.save();
                    ctx.translate(p.x, p.y);
                    ctx.rotate(p.rot * Math.PI / 180);
                    ctx.fillStyle = p.color;
                    ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                    ctx.restore();
                });
                confettiAnimId = requestAnimationFrame(frame);
            }
            frame();
        }


        function detenerConfetti() {
            if (confettiAnimId) {
                cancelAnimationFrame(confettiAnimId);
                confettiAnimId = null;
            }
            const canvas = document.getElementById('confetti-canvas');
            if (canvas) {
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }

