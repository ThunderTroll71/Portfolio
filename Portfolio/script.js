// Menu mobile
const menuBtn = document.getElementById("menu-btn");
const mobileMenu = document.getElementById("mobile-menu");

menuBtn.addEventListener("click", () => {
    mobileMenu.style.display = mobileMenu.style.display === "flex" ? "none" : "flex";
});

mobileMenu.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
        mobileMenu.style.display = "none";
    });
});

// Scroll reveal
const revealElements = document.querySelectorAll(".reveal");
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add("visible");
        }
    });
}, { threshold: 0.2 });

revealElements.forEach(el => observer.observe(el));

// Parallax header
window.addEventListener("scroll", () => {
    const header = document.querySelector("header");
    header.style.backdropFilter = `blur(${8 + window.scrollY / 80}px)`;
});

// ===== TOGGLE COMPÉTENCES / QUALITÉS =====
let currentSection = 'competences';

function switchSection(target) {
    if (target === currentSection) return;
    currentSection = target;

    const panelComp = document.getElementById('panel-competences');
    const panelQual = document.getElementById('panel-qualites');
    const optComp   = document.getElementById('opt-competences');
    const optQual   = document.getElementById('opt-qualites');
    const pill      = document.getElementById('toggle-pill');
    const title     = document.getElementById('section-toggle-title');

    if (target === 'competences') {
        panelComp.style.display = 'grid';
        panelQual.style.display = 'none';
        optComp.classList.add('active');
        optQual.classList.remove('active');
        pill.style.transform = 'translateX(0)';
        pill.style.width = optComp.offsetWidth + 'px';
        title.textContent = 'Mes compétences';
    } else {
        panelComp.style.display = 'none';
        panelQual.style.display = 'grid';
        optQual.classList.add('active');
        optComp.classList.remove('active');
        const offset = optComp.offsetWidth + 4;
        pill.style.transform = `translateX(${offset}px)`;
        pill.style.width = optQual.offsetWidth + 'px';
        title.textContent = 'Mes qualités';
    }

    // Relancer l'observer sur les nouvelles cartes visibles
    document.querySelectorAll('.reveal').forEach(el => {
        if (!el.classList.contains('visible')) observer.observe(el);
    });
}

// Init taille de la pill au chargement
window.addEventListener('load', () => {
    const optComp = document.getElementById('opt-competences');
    const pill    = document.getElementById('toggle-pill');
    if (optComp && pill) pill.style.width = optComp.offsetWidth + 'px';
});

// Données détaillées pour les modals
const modalData = {
    formation: {
        but: {
            title: "BUT Réseaux et Télécommunications",
            meta: ["2025 - Présent", "IUT Clermont Auvergne", "Aubière"],
            sections: [
                {
                    title: "Objectifs de la formation",
                    content: "Le BUT Réseaux et Télécommunications est une formation en 3 ans visant à former des techniciens supérieurs compétents dans les domaines des réseaux informatiques, des télécommunications et de la cybersécurité. Cette formation combine théorie et pratique pour développer des compétences techniques pointues."
                },
                {
                    title: "Programme",
                    content: "Le programme couvre l'administration réseau, les protocoles de communication, la sécurité informatique, le développement web, les systèmes d'exploitation, et inclut des projets tutorés et stages professionnels pour une mise en pratique concrète."
                },
                {
                    title: "Compétences acquises",
                    content: "Maîtrise des technologies réseau, compétences en cybersécurité, développement d'applications, administration système, gestion de projet, et capacité à travailler en équipe sur des projets techniques complexes."
                }
            ]
        },
        bac: {
            title: "Baccalauréat Technologique",
            meta: ["2022 - 2025", "Lycée", "Mention Assez Bien"],
            sections: [
                {
                    title: "Spécialisation",
                    content: "Formation technologique avec spécialisation en systèmes numériques et informatique. Acquisition de connaissances fondamentales en programmation, électronique et traitement de l'information."
                },
                {
                    title: "Projets réalisés",
                    content: "Réalisation de projets pratiques incluant la programmation de microcontrôleurs, la conception de circuits électroniques, et le développement d'applications informatiques simples."
                }
            ]
        }
    },
    divers: {
        culture: {
            title: "Culture",
            meta: ["Passion personnelle", "Développement continu"],
            sections: [
                {
                    title: "Centres d'intérêt",
                    content: "Je m'intéresse à l'histoire, à la science, et à la technologie. J'aime explorer différentes cultures à travers la lecture, les documentaires, et les voyages."
                },
                {
                    title: "Activités culturelles",
                    content: "En ce moment, je fait des quizz en ligne, par exemple sur des sites comme jklm ou k-culture."
                },
                {
                    title: "Apport personnel",
                    content: "Ma culture générale améliore ma capacité de réflexion et me donne de nouvelles perspectives sur les problématiques techniques et humaines."
                }
            ]
        },
        tech: {
            title: "Jeux vidéo",
            meta: ["Quotidien", "Passion"],
            sections: [
                {
                    title: "Genres préférés",
                    content: "Moba, MMORPG, RPG et MetroidVania."
                },
                {
                    title: "Jeux favoris",
                    content: "League of Legends, Clair Obscur: Expedition 33, Hollow Knight."
                },
                {
                    title: "Impact",
                    content: "Les jeux vidéo stimulent ma créativité, ma résolution de problèmes, et mes compétences en travail d'équipe, des qualités que j'applique également dans mes études et projets professionnels."
                },
                {
                    title: "Compétences techniques",
                    content: "Les jeux vidéo m'ont permis de développer des compétences telles que la gestion de ressources, la planification stratégique, le calcul d'optimisation, et l'analyse de données."
                }
            ]
        },
        sport: {
            title: "Sport & Activités physiques",
            meta: ["Régulier", "Équilibre vie pro/perso"],
            sections: [
                {
                    title: "Pratique sportive",
                    content: "Je pratique régulièrement des activités sportives pour maintenir un bon équilibre entre vie professionnelle et personnelle. Le sport m'aide à décompresser après une journée de travail ou d'études intensive et à garder l'esprit clair."
                },
                {
                    title: "Sports pratiqués",
                    content: "HandBall en équipe pour développer l'esprit collectif et la communication, running pour l'endurance et la discipline personnelle, et musculation pour la condition physique générale."
                },
                {
                    title: "Valeurs sportives",
                    content: "Le sport m'a appris la persévérance, la gestion du stress, le dépassement de soi et l'importance du travail d'équipe. Ces valeurs sont directement transposables dans mon parcours professionnel et académique."
                },
                {
                    title: "Impact sur mes études",
                    content: "La pratique sportive régulière améliore ma concentration, ma gestion du temps, et ma capacité à gérer la pression."
                }
            ]
        },
        musique: {
            title: "Musique",
            meta: ["Régulier", "Équilibre vie pro/perso"],
            sections: [
                {
                    title: "Pratique musicale",
                    content: "Je pratique régulièrement du piano pour maintenir un bon équilibre entre vie professionnelle et personnelle. La musique m'aide à décompresser après une journée de travail ou d'études intensive."
                },
                {
                    title: "Instruments pratiqués",
                    content: "Piano pour développer la coordination et la discipline, l'expression créative, améliorer la concentration et la communication."
                },
                {
                    title: "Valeurs musicales",
                    content: "La musique m'a appris la persévérance, la gestion du stress, le dépassement de soi. Ces valeurs sont directement transposables dans mon parcours professionnel et académique."
                },
                {
                    title: "Impact sur mes études",
                    content: "La pratique musicale régulière améliore ma concentration, ma gestion du temps, et ma capacité à gérer la pression."
                }
            ]
        }
    },
    competence: {
        reseau: {
            title: "Compétences Réseau",
            meta: ["Niveau Débutant/Intermédiaire", "En pratique régulière"],
            sections: [
                {
                    title: "Technologies maîtrisées",
                    content: "Configuration et administration de commutateurs et routeurs Cisco, mise en place de VLANs, routage statique et dynamique, protocoles réseau (TCP/IP, DNS, DHCP), et architecture réseau d'entreprise."
                },
                {
                    title: "Projets réalisés",
                    content: "Dans le cadre du cours RLAN : Conception d'infrastructures réseau, déploiement de réseau pour 4 personnes et documentation technique détaillée."
                },
                {
                    title: "Certifications visées",
                    content: "Préparation aux certifications Cisco CCNA, avec une solide compréhension des concepts fondamentaux et avancés du réseau."
                }
            ]
        },
        telecom: {
            title: "Compétences Télécommunications",
            meta: ["Niveau intermédiaire", "Formation continue"],
            sections: [
                {
                    title: "Domaines couverts",
                    content: "Compréhension des systèmes de télécommunications modernes (Fibres), technologies sans fil (Télévision), traitement du signal numérique, et architectures de communication avancées."
                },
                {
                    title: "Applications pratiques",
                    content: "Dans le cadre de la Saé 13 : Analyse de performances de fibres optique, compréhension des protocoles de communication TV ainsi que d'autres systèmes de communication filaires (RJ45 etc...)."
                }
            ]
        },
        scripting: {
            title: "Programmation & Développement",
            meta: ["Niveau avancé", "Pratique Quasi-Journalière"],
            sections: [
                {
                    title: "Langages maîtrisés",
                    content: "Python pour l'automatisation et le développement d'applications, Bash pour les scripts système Linux, JavaScript pour le développement web, et SQL pour la gestion de bases de données."
                },
                {
                    title: "IDE et outils",
                    content: "Utilisation de Git pour le versioning, développement web avec HTML/CSS/JavaScript, IDE Python (VSCode, Pycharm), et outils d'automatisation modernes."
                },
                {
                    title: "Réalisations",
                    content: "Création de scripts d'automatisation pour l'optimisation de tâches répétitives, développement d'applications web, et contribution à des projets open source."
                }
            ]
        },
        systemes: {
            title: "Compétences Systèmes",
            meta: ["Niveau Intermédiaire", "Linux & Windows"],
            sections: [
                {
                    title: "Systèmes d'exploitation",
                    content: "Administration de systèmes Linux et Windows Server. Maîtrise de la ligne de commande, gestion des services, et configuration système avancée."
                },
                {
                    title: "Virtualisation",
                    content: "Expérience avec VMware et VirtualBox pour la création et gestion d'environnements virtualisés. Déploiement de machines virtuelles et optimisation des ressources."
                },
                {
                    title: "Services IT",
                    content: "Configuration de serveurs web (Windows server), services de fichiers, Active Directory, et systèmes de sauvegarde automatisés."
                }
            ]
        }
    },
    qualite: {
        rigueur: {
            title: "Rigueur",
            meta: ["Qualité personnelle", "Appliquée au quotidien"],
            sections: [
                {
                    title: "Description",
                    content: "Je suis méthodique et précis dans mon travail. Je vérifie systématiquement mes productions avant de les rendre et je respecte les délais imposés."
                },
                {
                    title: "Exemples concrets",
                    content: "Dans mes projets académiques, je prends soin de documenter mon code, de tester mes livrables et de m'assurer que chaque détail est correct avant la remise finale."
                }
            ]
        },
        equipe: {
            title: "Esprit d'équipe",
            meta: ["Qualité relationnelle"],
            sections: [
                {
                    title: "Description",
                    content: "J'apprécie travailler en groupe et contribuer à une dynamique collective positive. Je suis à l'écoute et je sais m'adapter au rythme de mes coéquipiers."
                },
                {
                    title: "Exemples concrets",
                    content: "Lors du projet de jeu en Python, j'ai endossé le rôle de chef de groupe, coordonnant les tâches et veillant à l'implication de chacun dans le rendu final."
                }
            ]
        },
        curiosite: {
            title: "Curiosité",
            meta: ["Qualité intellectuelle"],
            sections: [
                {
                    title: "Description",
                    content: "Toujours en veille, j'aime explorer de nouveaux domaines, que ce soit dans le cadre de mes études ou en dehors, notamment en technologie et en culture générale."
                },
                {
                    title: "Exemples concrets",
                    content: "Je lis régulièrement des articles techniques, je suis des tutoriels en ligne, et je teste de nouveaux outils pour enrichir mes compétences en dehors des heures de cours."
                }
            ]
        },
        adaptable: {
            title: "Adaptabilité",
            meta: ["Qualité professionnelle"],
            sections: [
                {
                    title: "Description",
                    content: "Je m'adapte facilement à de nouveaux environnements, outils ou méthodes de travail, même lorsque les délais sont courts ou les situations inattendues."
                },
                {
                    title: "Exemples concrets",
                    content: "Lors de mes projets, j'ai régulièrement dû changer d'approche ou d'outil en cours de route, et j'ai su m'ajuster rapidement sans perdre en efficacité."
                }
            ]
        },
        autonome: {
            title: "Autonomie",
            meta: ["Qualité professionnelle"],
            sections: [
                {
                    title: "Description",
                    content: "Je suis capable de prendre des initiatives et de mener des tâches de façon indépendante, tout en sachant reconnaître mes limites et demander de l'aide si nécessaire."
                },
                {
                    title: "Exemples concrets",
                    content: "Plusieurs de mes projets personnels, comme le buzzer blind test, ont été réalisés de façon totalement autonome, de la conception à la réalisation finale."
                }
            ]
        },
        communicant: {
            title: "Communication",
            meta: ["Qualité relationnelle"],
            sections: [
                {
                    title: "Description",
                    content: "À l'aise à l'oral et à l'écrit, je sais adapter mon discours à mon interlocuteur, que ce soit un technicien ou un non-initié."
                },
                {
                    title: "Exemples concrets",
                    content: "Dans mon engagement associatif, j'ai développé ma capacité à communiquer clairement lors de l'organisation d'événements et dans la gestion du site web du club."
                }
            ]
        }
    },
    experience: {
        stage: {
            title: "Stage en entreprise",
            meta: ["2021", "1 semaine", "Environnement professionnel"],
            sections: [
                {
                    title: "Contexte",
                    content: "Stage réalisé dans le cadre de la découverte d'entreprise, permettant une immersion complète dans un environnement professionnel et la confirmation de mon projet professionnel."
                },
                {
                    title: "Missions principales",
                    content: "Découverte principale de l'entreprise et de son environnement professionnel."
                },
                {
                    title: "Apport personnel",
                    content: "Cette expérience m'a permis de comprendre les réalités du terrain, de voir des personnes travailler sur des cas concrets, et de renforcer mon envie de parcours professionnel."
                }
            ]
        },
        benevole: {
            title: "Engagement associatif",
            meta: ["2017 - Présent", "Handball Club de Sanvignes", "Bénévolat"],
            sections: [
                {
                    title: "Rôle et responsabilités",
                    content: "Participation active à l'organisation d'événements sportifs, aide aux personnes. Contribution à la vie associative."
                },
                {
                    title: "Projets menés",
                    content: "Organisation du site web, mise en place de journées de match et événements de rencontre sportive."
                },
                {
                    title: "Compétences développées",
                    content: "Organisation, gestion de projet, travail en équipe, communication interpersonnelle, et développement du sens des responsabilités."
                }
            ]
        },
        alternance: {
            title: "Projet d'alternance",
            meta: ["2026 - 2027", "Entreprise hors de l'IUT"],
            sections: [
                {
                    title: "Ce que je recherche",
                    content: "Je recherche une alternance en entreprise pour approfondir mes compétences techniques et acquérir une expérience professionnelle concrète dans le domaine des réseaux avec une partie cybersécurité."
                }
            ]
        }
    },
    projet: {
        projet1: {
            title: "Projets de cours",
            meta: ["2025 - 2026", "IUT Aubière", "Travail personnel"],
            sections: [
                {
                    title: "Contexte pédagogique",
                    content: "Les projets font partie intégrante de la formation BUT. Ils permettent de travailler sur des problématiques réelles en équipe, encadrés par des enseignants et parfois des professionnels."
                },
                {
                    title: "Projets réalisés",
                    content: "Dans le cadre de la Saé15 (Programmation), j'ai créé un outil permettant, en prenant un emploi du temps, à organiser des interventions dans les salles et avoir une amplitude horaire souhaitée."
                },
                {
                    title: "Méthodologie",
                    content: "Application de méthodologies vues en programmation, et aide de mes camarades, renforçant le travail d'équipe."
                },
                {
                    title: "Résultats",
                    content: "Validation réussie de tous les projets avec de bonnes évaluations. Acquisition de compétences pratiques et renforcement de la capacité à travailler en équipe sur des projets techniques complexes."
                }
            ]
        },
        projet2: {
            title: "Projet de développement en groupe",
            meta: ["2024 - 2025", "Développement Back End", "NSI"],
            sections: [
                {
                    title: "Description",
                    content: "Développement d'un jeu sur le thème de l'année (qui était l'art)."
                },
                {
                    title: "En quoi ça consiste ?",
                    content: "En groupe de 5, nous devions créer une application sur le thème de l'art. Nous avions décidé de créer un jeu sur ce thème afin de faire aimer l'art aux personnes à qui ça ne plaisait pas forcément."
                },
                {
                    title: "Ma place dans le projet",
                    content: "Durant ce projet, j'ai été désigné comme chef de groupe, ce qui impliquait de coordonner les tâches, gérer les délais, veiller à la qualité du rendu final et faire en sorte que tout le monde soit impliqué."
                },
                {
                    title: "Compétences acquises",
                    content: "Gestion de projet, travail en équipe, développement backend avec Python, versionning avec Git."
                }
            ]
        },
        projet3: {
            title: "Projet de création d'appareil pour des blind tests",
            meta: ["2020 - 2024", "C++", "Arduino"],
            sections: [
                {
                    title: "Objectif du projet",
                    content: "Création d'un appareil électronique capable de réaliser des blind tests (quizz musicaux) pour jouer à ces derniers."
                },
                {
                    title: "Scripts développés",
                    content: "J'ai développé des scripts en C++ pour l'Arduino afin de gérer les interactions avec les capteurs et les affichages, ainsi qu'un script en Python pour l'interface utilisateur."
                },
                {
                    title: "Compétences techniques",
                    content: "Programmation en C++ pour l'Arduino, gestion des capteurs et affichages, développement d'interfaces utilisateur en Python."
                }
            ]
        }
    }
};

// Gestion des modals
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modal-title");
const modalBody = document.getElementById("modal-body");
const modalClose = document.getElementById("modal-close");

const cards = document.querySelectorAll(".card");

cards.forEach(card => {
    card.addEventListener("click", () => {
        const type = card.dataset.type;
        const id = card.dataset.id;

        if (type && id && modalData[type] && modalData[type][id]) {
            const data = modalData[type][id];

            modalTitle.textContent = data.title;

            let bodyHTML = '';

            if (data.meta) {
                bodyHTML += '<div class="modal-meta">';
                data.meta.forEach(item => {
                    bodyHTML += `<div class="modal-meta-item">${item}</div>`;
                });
                bodyHTML += '</div>';
            }

            data.sections.forEach(section => {
                bodyHTML += '<div class="modal-section">';
                bodyHTML += `<h4>${section.title}</h4>`;
                bodyHTML += `<p>${section.content}</p>`;
                bodyHTML += '</div>';
            });

            modalBody.innerHTML = bodyHTML;
            modal.style.display = "flex";
        }
    });
});

modalClose.addEventListener("click", () => {
    modal.style.display = "none";
});

window.addEventListener("click", (e) => {
    if (e.target === modal) {
        modal.style.display = "none";
    }
});