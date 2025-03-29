import { useState, useEffect } from 'react';
// Pas d'import d'icônes externe

// --- Icônes SVG Internes (Validation/Inventaire) ---
const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-green-500 mx-auto">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

const CrossIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-red-500 mx-auto">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);
// --- Fin Icônes SVG Internes (Validation/Inventaire) ---

// --- Icônes SVG Internes (Panneaux Étape 1) ---
const DangerIcon = ({ className = "w-16 h-16" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} aria-label="Panneau Danger">
    <polygon points="50,10 10,90 90,90"
      fill="white"
      stroke="red"
      strokeWidth="10"
      strokeLinejoin="round" />
  </svg>
);

const InterdictionIcon = ({ className = "w-16 h-16" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} aria-label="Panneau Interdiction">
    <circle cx="50" cy="50" r="40"
      fill="white"
      stroke="red"
      strokeWidth="10" />
  </svg>
);

const ObligationIcon = ({ className = "w-16 h-16" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} aria-label="Panneau Obligation">
    <circle cx="50" cy="50" r="50" fill="white" />
    <circle cx="50" cy="50" r="46" fill={primaryColor} />
  </svg>
);

const IndicationIcon = ({ className = "w-16 h-16" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} aria-label="Panneau Indication">
    <rect x="0" y="0" width="100" height="100" fill="white" />
    <rect x="4" y="4" width="92" height="92" fill={primaryColor} />
  </svg>
);
// --- Fin Icônes SVG Internes (Panneaux Étape 1) ---


// --- Couleurs ---
const primaryColor = '#4682B4'; // Bleu Acier
const lightGreenColor = '#e7f4e7';
const instructionsBgColor = '#f3f4f6';
const tipsBgColor = '#fef9c3';
const warningBgColor = '#fee2e2';
const timerNormalColor = 'text-gray-700';
const timerWarningColor = 'text-orange-500';
const timerDangerColor = 'text-red-600';


// --- Icônes des Ressources ---
const resourceIcons = {
  money: '💰',
  oxygen: '💨',
  time: '⏱️',
};

// --- Traduction des Noms de Ressources ---
const resourceNamesFR = {
  money: 'Argent',
  oxygen: 'Oxygène',
  time: 'Temps',
};

// --- Valeurs initiales des ressources ---
const initialResources = {
  money: 1250,
  oxygen: 300,
  time: 800
};

// --- Taux d'échange constants ---
// <<< MODIFICATION : Retour aux taux d'échange validés >>>
const exchangeRates = {
    moneyToOxygen: { amountFrom: 100, amountTo: 10 },
    moneyToTime:   { amountFrom: 100, amountTo: 10 }, // Retour à 100:10
    timeToMoney:   { amountFrom: 100, amountTo: 10 },
    oxygenToTime:  { amountFrom: 20,  amountTo: 10 },
};
// <<< FIN MODIFICATION >>>


// --- Constantes du Timer ---
const COUNTDOWN_DURATION_SECONDS = 3600;
const DRAIN_AMOUNT_PER_MINUTE = 10;
const WARNING_THRESHOLD_SECONDS = 1200; // 20 minutes

// --- Types ---
interface Vehicle {
    name: string;
    money: number;
    oxygen: number;
    time: number;
    icon: string;
    availableFromStep?: number;
}

type ResourceType = keyof typeof initialResources;
type GameOverReason = 'portal' | 'resources' | 'time' | null;

const BouJeuApp = () => {
  const [currentPage, setCurrentPage] = useState('splash'); // Page actuelle
  const [currentStep, setCurrentStep] = useState(1); // Étape actuelle
  const [resources, setResources] = useState({ ...initialResources }); // Ressources du joueur
  const [resourcesAtStepStart, setResourcesAtStepStart] = useState({ ...initialResources }); // Ressources au début de l'étape actuelle
  const [inventory, setInventory] = useState({ // Inventaire
    baton: false,
    sphere: false,
    cauldron: false
  });
  const [currentVehicle, setCurrentVehicle] = useState<string | null>(null); // Véhicule actuel
  const [vehicleHistory, setVehicleHistory] = useState<string[]>([]); // Historique des véhicules utilisés
  const [codes, setCodes] = useState({ // Codes entrés
    code2: '',
    code3: '',
    code4: '',
    portalCode: ''
  });
  const [inputCode, setInputCode] = useState(''); // Code en cours de saisie
  const [message, setMessage] = useState(''); // Message d'info/erreur
  const [showCodeInput, setShowCodeInput] = useState(false); // Afficher saisie code
  const [codeToCheck, setCodeToCheck] = useState(''); // Quel code vérifier
  const [showCelebration, setShowCelebration] = useState(false); // Modal célébration
  const [celebrationMessage, setCelebrationMessage] = useState(''); // Message célébration
  const [rewards, setRewards] = useState<{ money: number; oxygen: number; time: number } | null>(null); // Récompenses modal
  const [showFinalConfirmation, setShowFinalConfirmation] = useState(false); // Modal confirmation finale
  const [vehicleToConfirm, setVehicleToConfirm] = useState<string | null>(null); // Véhicule à confirmer
  const [showVehicleConfirmation, setShowVehicleConfirmation] = useState(false); // Modal confirmation véhicule
  const [showPortalModal, setShowPortalModal] = useState(false); // Modal détails portail
  const [selectedPortalCode, setSelectedPortalCode] = useState<string | null>(null); // Code portail sélectionné
  const [showExchangeConfirmation, setShowExchangeConfirmation] = useState(false);
  const [exchangeDetails, setExchangeDetails] = useState<{
    from: ResourceType;
    to: ResourceType;
    amountFrom: number;
    amountTo: number;
    fromResourceFR: string;
    toResourceFR: string;
  } | null>(null);

  const [showNoMovesModal, setShowNoMovesModal] = useState(false); // Afficher la modale de blocage
  const [gameOverReason, setGameOverReason] = useState<GameOverReason>(null); // Raison du game over

  // États pour le Timer
  const [countdownSeconds, setCountdownSeconds] = useState(COUNTDOWN_DURATION_SECONDS);
  const [isCountdownRunning, setIsCountdownRunning] = useState(false);
  const [isTimeDraining, setIsTimeDraining] = useState(false);
  const [hasTimerStarted, setHasTimerStarted] = useState(false);


  // Objets de l'inventaire
  const inventoryItems = {
    baton: { name: "Bâton d'Ubiquité", icon: "🪄", description: "Une baguette magique qui contrôle l'espace et le temps" },
    sphere: { name: "Sphère de Vision", icon: "🔮", description: "Une boule de cristal ornée qui révèle les secrets" },
    cauldron: { name: "Chaudron d'Infinité", icon: "🧪", description: "Un chaudron magique aux pouvoirs mystérieux" }
  };

  // Véhicules disponibles
  const vehicles: { [key: string]: Vehicle } = {
    foot: { name: 'À pied', money: 150, oxygen: 60, time: 600, icon: '🚶' },
    bike: { name: 'À vélo', money: 300, oxygen: 90, time: 450, icon: '🚲' },
    bus: { name: 'En transports en commun', money: 600, oxygen: 120, time: 330, icon: '🚌' },
    electric: { name: 'En Véhicule Électrique Léger', money: 900, oxygen: 150, time: 210, icon: '🚗', availableFromStep: 2 },
    car: { name: 'En Voiture', money: 1500, oxygen: 360, time: 90, icon: '🚘', availableFromStep: 2 }
  };

  // Récompenses par étape
  const questRewards = {
    2: { money: 800, oxygen: 190, time: 330 },
    3: { money: 450, oxygen: 110, time: 240 },
    4: { money: 250, oxygen: 60, time: 120 }
  };

  // Messages de célébration
  const celebrationMessages = {
    2: "🎉 Félicitations, aventuriers ! Le Bâton d'Ubiquité est maintenant entre vos mains. Sa puissance magique vous ouvre de nouvelles possibilités !",
    3: "✨ Incroyable ! La Sphère de Vision brille maintenant dans votre inventaire. Sa lumière mystique vous guidera vers de nouveaux horizons !",
    4: "⚡ Extraordinaire ! Le Chaudron d'Infinité résonne de sa magie ancestrale. Vous êtes prêt pour l'ultime défi !"
  };

  // Scroll en haut au changement de page
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage]);

  // Mémoriser les ressources au début de chaque étape
  useEffect(() => {
    setResourcesAtStepStart(resources);
  }, [currentStep]);

  // <<< MODIFICATION : canAffordAnyVehicle utilise les taux finaux >>>
  // Fonction pour vérifier si un véhicule est achetable, même potentiellement
  const canAffordAnyVehicle = (currentResources: typeof resources, step: number): boolean => {
    for (const key in vehicles) {
        const vehicle = vehicles[key];
        const isStepAvailable = !vehicle.availableFromStep || step >= vehicle.availableFromStep;

        if (isStepAvailable) {
            if (currentResources.money >= vehicle.money && currentResources.oxygen >= vehicle.oxygen && currentResources.time >= vehicle.time) {
                console.log(`CAN AFFORD CHECK: Véhicule ${vehicle.name} achetable directement.`);
                return true;
            }

            const moneyDeficit = Math.max(0, vehicle.money - currentResources.money);
            const oxygenDeficit = Math.max(0, vehicle.oxygen - currentResources.oxygen);
            const timeDeficit = Math.max(0, vehicle.time - currentResources.time);

            const moneySurplus = Math.max(0, currentResources.money - vehicle.money);
            const oxygenSurplus = Math.max(0, currentResources.oxygen - vehicle.oxygen);
            const timeSurplus = Math.max(0, currentResources.time - vehicle.time);

            let canCoverMoney = moneyDeficit === 0;
            if (moneyDeficit > 0) {
                const moneyFromTime = Math.floor(timeSurplus / exchangeRates.timeToMoney.amountFrom) * exchangeRates.timeToMoney.amountTo;
                if (moneyFromTime >= moneyDeficit) canCoverMoney = true;
            }

            let canCoverOxygen = oxygenDeficit === 0;
            if (oxygenDeficit > 0) {
                const oxygenFromMoney = Math.floor(moneySurplus / exchangeRates.moneyToOxygen.amountFrom) * exchangeRates.moneyToOxygen.amountTo;
                if (oxygenFromMoney >= oxygenDeficit) canCoverOxygen = true;
            }

            let canCoverTime = timeDeficit === 0;
            if (timeDeficit > 0) {
                // Utilise le taux moneyToTime de 100:10
                const timeFromMoney = Math.floor(moneySurplus / exchangeRates.moneyToTime.amountFrom) * exchangeRates.moneyToTime.amountTo;
                const timeFromOxygen = Math.floor(oxygenSurplus / exchangeRates.oxygenToTime.amountFrom) * exchangeRates.oxygenToTime.amountTo;
                if (timeFromMoney + timeFromOxygen >= timeDeficit) canCoverTime = true;
            }

            if (canCoverMoney && canCoverOxygen && canCoverTime) {
                 console.log(`CAN AFFORD CHECK: Véhicule ${vehicle.name} potentiellement achetable (via surplus).`);
                return true;
            }
        }
    }
    console.log("CAN AFFORD CHECK: Aucun véhicule achetable, même potentiellement.");
    return false;
  };
  // <<< FIN MODIFICATION >>>


  // Vérifier la possibilité de continuer
  useEffect(() => {
    if (currentPage === 'game' && !currentVehicle && !showNoMovesModal && !showCelebration) {
      if (!canAffordAnyVehicle(resources, currentStep)) {
        setMessage("Il semble que vous soyez à court de ressources pour continuer...");
        setShowNoMovesModal(true);
      }
    }
  }, [resources, currentPage, currentVehicle, currentStep, showNoMovesModal, showCelebration]);

  // --- Logique du Timer ---
  useEffect(() => {
    if (currentStep === 1 && (currentPage === 'game' || currentPage === 'instructions') && !hasTimerStarted) {
      console.log("TIMER: Démarrage du compte à rebours initial.");
      setCountdownSeconds(COUNTDOWN_DURATION_SECONDS);
      setIsCountdownRunning(true);
      setHasTimerStarted(true);
      setIsTimeDraining(false);
    }
  }, [currentPage, currentStep, hasTimerStarted]);

  useEffect(() => {
    if (!isCountdownRunning || currentPage === 'victory' || currentPage === 'gameover') return;
    console.log("TIMER: Intervalle du compte à rebours actif.");
    const intervalId = setInterval(() => {
      setCountdownSeconds(prevSeconds => {
        if (prevSeconds <= 1) {
          console.log("TIMER: Compte à rebours terminé, passage au drain.");
          clearInterval(intervalId);
          setIsCountdownRunning(false);
          setIsTimeDraining(true);
          return 0;
        }
        return prevSeconds - 1;
      });
    }, 1000);
    return () => {
        console.log("TIMER: Nettoyage de l'intervalle du compte à rebours.");
        clearInterval(intervalId);
    }
  }, [isCountdownRunning, currentPage]);

  useEffect(() => {
    if (!isTimeDraining || currentPage === 'victory' || currentPage === 'gameover') return;
    console.log("TIMER: Intervalle du drain de temps actif.");
    const intervalId = setInterval(() => {
        setResources(prevResources => {
            if (prevResources.time <= 0) {
                console.log("TIMER: Temps déjà écoulé dans le drain.");
                return prevResources;
            }
            const newTime = Math.max(0, prevResources.time - DRAIN_AMOUNT_PER_MINUTE);
            console.log(`TIMER: Drain de temps - ${prevResources.time} -> ${newTime}`);
            return { ...prevResources, time: newTime };
        });
    }, 60000);
    return () => {
        console.log("TIMER: Nettoyage de l'intervalle du drain de temps.");
        clearInterval(intervalId);
    }
  }, [isTimeDraining, currentPage]);

  useEffect(() => {
      if (resources.time <= 0 && isTimeDraining && currentPage !== 'gameover' && currentPage !== 'victory') {
          console.log("TIMER: Défaite par manque de temps détectée.");
          setIsTimeDraining(false);
          setGameOverReason('time');
          setCurrentPage('gameover');
      }
  }, [resources.time, isTimeDraining, currentPage]);
  // --- Fin Logique du Timer ---


  // Initier l'achat de véhicule
  const buyVehicle = (vehicleType: string) => {
    setVehicleToConfirm(vehicleType);
    setShowVehicleConfirmation(true);
  };

  // Confirmer l'achat de véhicule
  const confirmVehicle = (vehicleType: string) => {
    const vehicle = vehicles[vehicleType];
    if (resources.money >= vehicle.money && resources.oxygen >= vehicle.oxygen && resources.time >= vehicle.time) {
      setResources(prevResources => ({
        money: prevResources.money - vehicle.money,
        oxygen: prevResources.oxygen - vehicle.oxygen,
        time: prevResources.time - vehicle.time
      }));
      setCurrentVehicle(vehicleType);
      setVehicleHistory(prevHistory => [...prevHistory, vehicleType]);
      setMessage(`Vous avez choisi de voyager ${vehicle.name}!`);
      if (currentStep === 1 && !inventory.baton) { setShowCodeInput(true); setCodeToCheck('code2'); }
      else if (currentStep === 2 && !inventory.sphere) { setShowCodeInput(true); setCodeToCheck('code3'); }
      else if (currentStep === 3 && !inventory.cauldron) { setShowCodeInput(true); setCodeToCheck('code4'); }
      else if (currentStep === 4) { setShowCodeInput(true); setCodeToCheck('portal'); }
      setCurrentPage('instructions');
    } else {
      setMessage("Ressources insuffisantes pour ce véhicule !");
    }
    setShowVehicleConfirmation(false);
    setVehicleToConfirm(null);
  };

  // Initier l'échange de ressources
  const exchangeResources = (from: ResourceType, to: ResourceType) => {
    let amountFrom = 0;
    let amountTo = 0;
    let fromFR = '', toFR = '';

    if (from === 'money' && to === 'oxygen') {
        amountFrom = exchangeRates.moneyToOxygen.amountFrom; amountTo = exchangeRates.moneyToOxygen.amountTo;
        fromFR = resourceNamesFR.money; toFR = resourceNamesFR.oxygen;
    }
    else if (from === 'money' && to === 'time') {
        amountFrom = exchangeRates.moneyToTime.amountFrom; amountTo = exchangeRates.moneyToTime.amountTo;
        fromFR = resourceNamesFR.money; toFR = resourceNamesFR.time;
    }
    else if (from === 'time' && to === 'money') {
        amountFrom = exchangeRates.timeToMoney.amountFrom; amountTo = exchangeRates.timeToMoney.amountTo;
        fromFR = resourceNamesFR.time; toFR = resourceNamesFR.money;
    }
    else if (from === 'oxygen' && to === 'time') {
        amountFrom = exchangeRates.oxygenToTime.amountFrom; amountTo = exchangeRates.oxygenToTime.amountTo;
        fromFR = resourceNamesFR.oxygen; toFR = resourceNamesFR.time;
    }
    else return;

    setExchangeDetails({ from: from, to: to, amountFrom: amountFrom, amountTo: amountTo, fromResourceFR: fromFR, toResourceFR: toFR });
    setShowExchangeConfirmation(true);
  };


  // Confirmer l'échange
  const confirmExchange = () => {
    if (!exchangeDetails) return;
    const { from, to, amountFrom, amountTo, fromResourceFR } = exchangeDetails;
    if (resources[from] >= amountFrom) {
      const newResources = { ...resources };
      newResources[from] -= amountFrom;
      newResources[to] += amountTo;
      setResources(newResources);
      setMessage(`Échange réussi: ${amountFrom}${resourceIcons[from]} → ${amountTo}${resourceIcons[to]}`);
    } else {
      setMessage(`Pas assez de ${fromResourceFR.toLowerCase()} (${resourceIcons[from]}) !`);
    }
    setShowExchangeConfirmation(false);
    setExchangeDetails(null);
  };

  // Vérifier le code entré
  const checkCode = () => {
    const correctCodes = {
      code2: ['5041'], code3: ['8664', '2695', '7298', '3289', '4295', '4896'],
      code4: ['6729'], portal: ['5703']
    };
    if (codeToCheck === 'portal') {
      setShowFinalConfirmation(true);
      return;
    }

    if (correctCodes[codeToCheck as keyof typeof correctCodes]?.includes(inputCode)) {
      let nextStep = currentStep, newMessage = '', newInventory = { ...inventory };
      let rewardKey: keyof typeof questRewards | null = null;

      if (codeToCheck === 'code2' && !inventory.baton) { newInventory.baton = true; newMessage = "Bâton d'Ubiquité trouvé !"; nextStep = 2; rewardKey = 2; }
      else if (codeToCheck === 'code3' && !inventory.sphere) { newInventory.sphere = true; newMessage = "Sphère de Vision trouvée !"; nextStep = 3; rewardKey = 3; }
      else if (codeToCheck === 'code4' && !inventory.cauldron) { newInventory.cauldron = true; newMessage = "Chaudron d'Infinité trouvé !"; nextStep = 4; rewardKey = 4; }

      if (rewardKey && questRewards[rewardKey]) {
        const reward = questRewards[rewardKey];
        setRewards(reward);
        setCelebrationMessage(celebrationMessages[nextStep as keyof typeof celebrationMessages] || '');
        setShowCelebration(true);
        setResources(prev => ({
          money: prev.money + reward.money,
          oxygen: prev.oxygen + reward.oxygen,
          time: prev.time + reward.time
        }));
      }

      setInventory(newInventory); setMessage(newMessage); setCurrentStep(nextStep);
      setCodes({ ...codes, [codeToCheck]: inputCode });
      setShowCodeInput(false);
      setInputCode('');
      setCurrentVehicle(null);
      setCurrentPage('game');
    } else {
      setMessage('Code incorrect. Essayez encore !');
    }
  };

  // Confirmer le code final
  const confirmFinalCode = () => {
    const correctCodes = { portal: ['5703'] };
    if (correctCodes.portal.includes(inputCode)) {
      setCurrentPage('victory');
    } else {
      setGameOverReason('portal');
      setCurrentPage('gameover');
    }
    setShowFinalConfirmation(false);
    setShowCodeInput(false);
  };

  // Confirmer le game over par blocage
  const handleConfirmNoMoves = () => {
    setGameOverReason('resources');
    setShowNoMovesModal(false);
    setCurrentPage('gameover');
  }


  // Mise à jour de l'objectif
  useEffect(() => {
    if (currentPage === "game" && message === '') {
        if (currentStep === 1 && !inventory.baton) setMessage("Trouvez le Bâton d'ubiquité");
        else if (currentStep === 2 && !inventory.sphere) setMessage("Trouvez la Sphère de Vision");
        else if (currentStep === 3 && !inventory.cauldron) setMessage("Trouvez le Chaudron d'Infinité.");
        else if (currentStep === 4) setMessage("Trouvez le portail magique.");
      }
  }, [currentStep, inventory, currentPage, message]);

  // Démarrer le jeu
  const startGame = () => setCurrentPage('game');

  // Réinitialiser le jeu
  const resetGame = () => {
    setCurrentPage('splash'); setCurrentStep(1);
    setResources({ ...initialResources });
    setInventory({ baton: false, sphere: false, cauldron: false });
    setCurrentVehicle(null);
    setVehicleHistory([]);
    setCodes({ code2: '', code3: '', code4: '', portalCode: '' });
    setInputCode(''); setMessage(''); setShowCodeInput(false); setCodeToCheck('');
    setShowCelebration(false); setCelebrationMessage(''); setRewards(null);
    setShowFinalConfirmation(false); setShowPortalModal(false); setSelectedPortalCode(null);
    setShowVehicleConfirmation(false); setVehicleToConfirm(null);
    setShowExchangeConfirmation(false); setExchangeDetails(null);
    setResourcesAtStepStart({ ...initialResources });
    setShowNoMovesModal(false);
    setGameOverReason(null);
    setCountdownSeconds(COUNTDOWN_DURATION_SECONDS);
    setIsCountdownRunning(false);
    setIsTimeDraining(false);
    setHasTimerStarted(false);
  };


  // Choix de portails
  const portalChoices = {
    '3750': { name: 'La Tour Elithis', image: 'https://lh6.googleusercontent.com/VRzonN1AY1YiD-k9MLsAy_eGRwhjFa4cvx4LR9yUIpVuGIMIV7mRXDYxVYjAEk-oRC00rjUl1Ng5-OzgYRfvFsFoBHb1h9LFlSQ9TSMUiQc7O-OT362Nk3o6Y5e10PQV5VSm7nyDkBU=w1200', description: "Située à Dijon, c'est la première tour de bureaux à énergie positive au monde. Elle est pionnière en matière de construction durable." },
    '7530': { name: "La Saline Royale d'Arc-et-Senans", image: 'https://lh4.googleusercontent.com/k_8rzjh8rdD1CFsIIFZzjdqlCvDhy9yy598wo8OwPyzm5WDsBjb3KgMkM01Iy7nZccVC7A6nQpVL8QSVi99941DwHBNm0O0AJX53SO_6OB1Ej9V3cMpqM9cp5wXbvHiyk_1hGSCRf9c=w740', description: "Chef-d'œuvre de l'architecte Claude Nicolas Ledoux se trouve dans le Doubs. Il est classé au patrimoine mondial de l'UNESCO et témoigne de l'architecture industrielle du XVIIIe siècle." },
    '5703': { name: 'Le Lac Kir', image: 'https://lh5.googleusercontent.com/twxlxe9NtCc1a-RqOeen2MrvLOUkq74ugmIB6BhjnI-5iBSIz7d3BOFjq8XMvFryURKH-aU9pHv9q7EVYwdmKk7RQD_SnwyTV1tdeqOxjqfeSzWYHOTu697kjV0_kTVNipXsxH6uCN0=w1276', description: "Lac artificiel aux portes de Dijon, nommé d'après le chanoine Félix Kir, héros de la Résistance et Maire de Dijon. C'est un lieu populaire pour la détente, les sports nautiques et les promenades." },
    '0357': { name: 'La Cité de la Gastronomie', image: 'https://lh4.googleusercontent.com/hUWdTwIGvHa6SN-_ZLSzmjTtkayjJiiVIf7-XWudGTp_ivJZUWS0WhI-7PuX2EloMu74EtNpdgUACk8Vw-mb_8iDDT5kI1k4n6VkvXOe7pJk5Mv8ri0PUrp8vQHNyhxGrJxNRGWfXRE=w1442', description: "Située à Dijon, elle célèbre le repas gastronomique des Français, inscrit au patrimoine culturel immatériel de l'humanité par l'UNESCO." },
    '3075': { name: 'Le Pont Paul-Bert', image: 'https://lh3.googleusercontent.com/CxnaTb4wdz3YoAGDdVvWYsDk_qmyzEBwmeYiF7NMTULFuNEbPPqMcC7czRfQ8MXKDlpzaWEs6WPrStxU3QiI5-LtRfwsjd-BXD1Cc1sBFH15WY2-F6P0rOqoDfPnjDmcdQyUW7W1zW0=w1280', description: "Pont emblématique d'Auxerre enjambant l'Yonne, il a été contruit entre 37 et 17 avant J-C et offre une vue pittoresque sur la ville et sa cathédrale." },
    '3507': { name: 'Le Lac de Vouglans', image: 'https://lh6.googleusercontent.com/2U5OzDroFPfuhSR4ku0uUHaj4y0YhP1XXhRYH-a24lxMepCzZz61s0GPBTEJpghhbvkRE_tsQJJhIP34Iz_Qkt7eYD94G690PSxrepe6gnEDtdGZaFtdqY3fiYHItXpsueZrynwiKCU=w1280', description: "Troisième plus grande retenue artificielle de France, située dans le Jura. Un lieu prisé pour les activités nautiques et la beauté de ses paysages." },
    '0753': { name: 'La Citadelle de Besançon', image: 'https://lh3.googleusercontent.com/vJeOK2WhqdY41f5gthKi7jDH4sNtcIvhcXPD1sAOtmZ1h-NHA7zN0pqGH5DBu0A-X1sTQGbTJjIjYGyI8oMaT3X5dPg-SJFpCgGfkjINr_G8J19MRfZn28HSr-5tPuTR8oxo3FFjQVQ=w1149', description: "Forteresse majestueuse conçue par Vauban, surplombant Besançon. Elle est classée au patrimoine mondial de l'UNESCO et abrite plusieurs musées et un jardin zoologique." },
    '3570': { name: "Le Théatre Romain d'Autun", image: 'https://lh3.googleusercontent.com/8EvzFc5qA9XRBz-bjFw1IQM7MikXmCB-CQnaRpYigNz9somSF7Bl3lAF8jQ39WhIl9QqNXR2eVMW-bDk_jAeoV6xzqA13F3Wtc7CiJC3yJuDtEf8ZEDdC4hXTsmB2CObYWfdaeOHPUc=w740', description: "L'un des plus grands théâtres romains de la Gaule, témoignant de l'importance d'Autun (Augustodunum) à l'époque romaine." },
    '3705': { name: 'Le Lion de Belfort', image: 'https://lh4.googleusercontent.com/NTzMPnk3uXQhjvAQOYkI6dNcAQhJXVA80hNifhuQM52xjHq7HuJuDLgU6xHMMvmBmAYxMEe4P3eZdzI9lqDLSmWhFfyH4c-guswVBzRYJD8rLef53pSBnwKoHEAPWKmRxj9dFNIosIU=w740', description: "Sculpture monumentale réalisée par Auguste Bartholdi (le créateur de la Statue de la Liberté), commémorant la résistance de Belfort lors du siège de 1870-1871." },
    '3057': { name: 'Le Marteau-Pilon du Creusot', image: 'https://lh6.googleusercontent.com/zr3txxUiGuqGyxlGFX1deAB0a_Gq0NAO9nDrl8MkzqT-Q3OS93mtfixDtDl5375pgV_rCrk0DSJ5opYapMA4qp5MVSQfmFka0Yc_SKU8SfL1YiU1DQhI-rmwajun_7nI6EthLYHRl8Q=w740', description: "Symbole impressionnant du patrimoine industriel du Creusot, ce marteau-pilon à vapeur de 100 tonnes fut l'un des plus puissants au monde en son temps." },
    '5730': { name: 'La Cathédrale de Nevers', image: 'https://lh5.googleusercontent.com/TcDEgSERi6rHHdOSiEzb66MLUlHP_Z0PqwYSXFUFYyb1HBdQhQo3rIOnwxNRsKi05Z4N_OZydddZMbvBNLIU81wM9phO4mMXe2jrsR-kUSUMzc2liHmU74VL-mB0lmubNsJW4u5H5EQ=w740', description: "Cathédrale Saint-Cyr-et-Sainte-Julitte, remarquable par ses deux chœurs opposés, roman et gothique, et ses vitraux contemporains." },
    '5370': { name: 'Les Viaducs de Morez', image: 'https://lh5.googleusercontent.com/Sd3CIpCgbdDUQuguqHRWxSQaM4YutgHWCqNVcHQYryrDIlXP5eIhsyV4ByRwwglc000-0-AxtwvSJvgjFvs4UC7PHTyFg3cgqtiJAfiump2la5iMPgxC7eFSfzuX9hKT8B6QdnUtm-U=w740', description: "Ensemble de viaducs ferroviaires spectaculaires dans le Haut-Jura, permettant à la ligne des Hirondelles de franchir la vallée de la Bienne." }
  };
  type PortalCodeType = keyof typeof portalChoices;


  // Ouvrir modal détails portail
  const openPortalModal = (code: string) => {
    if (code in portalChoices) {
        setSelectedPortalCode(code as PortalCodeType);
        setShowPortalModal(true);
    } else {
        console.error("Code de portail invalide :", code);
    }
 };
  // Fermer modal détails portail
  const closePortalModal = () => { setShowPortalModal(false); setSelectedPortalCode(null); };

  // Formatter le temps pour l'affichage
  const formatTime = (totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Composant pour afficher le timer
  const TimerDisplay = () => {
    if (!hasTimerStarted || currentPage === 'splash' || currentPage === 'home' || currentPage === 'victory' || currentPage === 'gameover') {
        return null;
    }

    let textColor = timerNormalColor;
    let displayText = formatTime(countdownSeconds);

    if (isTimeDraining) {
        textColor = timerDangerColor;
        displayText = `${formatTime(resources.time)} (-${DRAIN_AMOUNT_PER_MINUTE}/min)`;
    } else if (isCountdownRunning && countdownSeconds <= WARNING_THRESHOLD_SECONDS) {
        textColor = timerWarningColor;
    }

    return (
      <div className={`fixed top-2 right-4 text-2xl font-bold p-2 bg-white bg-opacity-80 rounded-lg shadow ${textColor} z-40`}>
        ⏱️ {displayText}
      </div>
    );
  };


  // --- AFFICHAGE DES PAGES ---

  // Page Splash
  if (currentPage === 'splash') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white p-4 cursor-pointer"
        onClick={() => setCurrentPage('home')}>
        <img
          src="https://i.ibb.co/3mrZJY1H/BOU-JEU-REDUIT-COMPRESSE.png"
          alt="BOU-JEU Splash"
          className="max-w-[90vw] max-h-[90vh] w-auto h-auto object-contain rounded-2xl shadow-lg"
        />
      </div>
    );
  }

  // En-tête
  const renderHeader = () => {
    if (currentPage !== 'splash' && currentPage !== 'victory' && currentPage !== 'gameover' && currentPage !== 'home') {
      return (
        <div className="flex justify-center items-center py-4 relative">
          <img
            src="https://i.ibb.co/mVs3C5tG/LOGO-BOU-JEU.png"
            alt="BOU-JEU Logo"
            className="w-40 h-24 object-contain"
          />
          <TimerDisplay />
        </div>
      );
    }
    return null;
  };

  // Page d'Accueil
  if (currentPage === 'home') {
    return (
        <div className="min-h-screen bg-white p-4 flex flex-col">
          <div className="text-center mb-6 md:mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-[#4682B4]">L'aventure commence ici !</h1>
          </div>
          <div className="flex-grow flex flex-col gap-6 md:gap-8">
            <div className="flex flex-col md:flex-row md:items-stretch gap-4 md:gap-6">
              <div className="w-full md:w-2/3 bg-[#f3f4f6] rounded-lg shadow-lg p-4 md:p-6 flex flex-col justify-center order-2 md:order-1">
                <h3 className="text-xl font-bold mb-4 text-[#4682B4]">L'histoire</h3>
                <p className="mb-4 text-[#333]">
                  Les Bous, des créatures venues d'une autre planète, ont atterri en catastrophe sur Terre.
                  Mais leur magie s'affaiblit, chaque minute. Ils ont besoin de votre aide pour se déplacer et rentrer rapidement chez eux !
                </p>
                <p className="mb-4 text-[#333]">
                  Votre mission est d'activer un portail magique caché en Bourgogne-Franche-Comté.
                  Pour cela, vous devrez retrouver trois objets magiques :
                </p>
                <ul className="mb-0 ml-4 list-disc list-inside text-[#333]">
                  <li>Le Bâton d'Ubiquité</li>
                  <li>La Sphère de Vision</li>
                  <li>Le Chaudron d'Infinité</li>
                </ul>
              </div>
               <div className="w-full md:w-1/3 flex items-center justify-center order-1 md:order-2 p-4 md:p-0">
                <img
                  src="https://i.ibb.co/mVs3C5tG/LOGO-BOU-JEU.png"
                  alt="Logo BOU-JEU"
                  className="max-w-full h-auto md:h-full object-contain rounded-lg"
                  style={{ maxHeight: '40vh' }}
                />
              </div>
            </div>
            <div className="flex flex-col md:flex-row md:items-stretch gap-4 md:gap-6">
               <div className="w-full md:w-1/3 flex items-center justify-center order-1 md:order-1 p-4 md:p-0">
                 <img
                     src="https://cdn.midjourney.com/fede58be-c846-415e-967c-00938a452ab0/0_0.png"
                     alt="Illustration Bous"
                     className="max-w-full h-auto md:h-full object-contain rounded-lg"
                     style={{ maxHeight: '40vh' }}
                 />
               </div>
              <div className="w-full md:w-2/3 bg-[#f3f4f6] rounded-lg shadow-lg p-4 md:p-6 flex flex-col justify-center order-2 md:order-2">
                <h3 className="text-xl font-bold mb-4 text-[#4682B4]">Comment jouer ?</h3>
                <p className="mb-4 text-[#333]">
                  <span className="font-bold">Pour progresser, à chaque étape, choisissez un moyen de transport et gérez vos ressources :</span>
                </p>
                <ul className="mb-4 ml-4 space-y-2 list-none">
                   <li><span className="font-bold">{resourceIcons.money} {resourceNamesFR.money}:</span> Achetez des véhicules et échangez contre d'autres ressources.</li>
                   <li><span className="font-bold">{resourceIcons.oxygen} {resourceNamesFR.oxygen}:</span> Nécessaire à la respiration des Bous. Ils en consomment plus selon les véhicules. C'est une ressource stratégique.</li>
                   <li><span className="font-bold">{resourceIcons.time} {resourceNamesFR.time}:</span> Certains déplacements prennent plus de temps. Le temps est précieux !</li>
                 </ul>
                 <p className="mb-2 font-semibold text-[#d9534f]">
                    ⚠️ Attention : Après 1h de jeu, votre ressource Temps diminuera de 10, chaque minute !
                 </p>
                <p className="mb-2 text-[#333]">
                  Chaque trajet a un coût. Vous pouvez échanger vos ressources, mais attention aux taux de change. Choisissez bien !
                </p>
                <p className="mb-0 text-[#333]">
                  <span className="font-bold">Pour finir, répondez à l'énigme de chaque étape.</span>
                </p>
              </div>
            </div>
          </div>
          <div className="mt-6 md:mt-8 text-center">
            <button onClick={startGame} className="w-full max-w-xs mx-auto bg-[#4682B4] text-white py-3 px-6 rounded-lg font-bold hover:bg-[#3a6d96] transition-colors text-lg">
              Commencer l'aventure
            </button>
          </div>
        </div>
      );
  }


  // Page d'Instructions
  if (currentPage === 'instructions') {
    return (
      <div className="min-h-screen bg-white p-4">
        {renderHeader()}
        <div className="bg-[#f5f5f5] rounded-lg shadow-md p-4 mb-4">
          <h2 className="text-xl font-bold mb-4 text-[#4682B4]">
            Étape {currentStep}:
            {currentStep === 1 && " La Quête du Bâton d'Ubiquité"}
            {currentStep === 2 && " La Quête de la Sphère de Vision"}
            {currentStep === 3 && " La Quête du Chaudron d'Infinité"}
            {currentStep === 4 && " La Quête du Portail Magique"}
          </h2>
          <div className="bg-[#e6f7ff] rounded p-3 mb-4">
            <p className="text-[#333]">Suivez ces instructions pour résoudre la quête !</p>
          </div>
          <div className="grid grid-cols-3 gap-6 mb-6 bg-white rounded-xl p-6">
            {Object.entries(inventoryItems).map(([key, item]) => (
              <div key={key} className={`flex flex-col items-center p-6 rounded-xl transition-all transform hover:scale-105 ${inventory[key as keyof typeof inventory] ? 'bg-[#5cb85c] bg-opacity-15 border-2 border-[#5cb85c]' : 'bg-[#f5f5f5] border-2 border-transparent'}`}>
                <div className="text-4xl mb-3">{item.icon}</div>
                <h3 className="text-lg font-bold text-[#333] mb-2 text-center">{item.name}</h3>
                <p className="text-sm text-[#666] text-center">{item.description}</p>
                <div className="mt-3">
                  {inventory[key as keyof typeof inventory] ? <CheckIcon /> : <CrossIcon />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {currentVehicle && (
          <div style={{ backgroundColor: lightGreenColor }} className="rounded-lg shadow-md p-4 mb-4 text-center text-[#333]">
            <h3 className="text-lg font-bold mb-2 text-[#4682B4]">Votre véhicule actuel</h3>
            <p className="mb-2">{vehicles[currentVehicle].icon} {vehicles[currentVehicle].name}</p>
            <p className="font-bold mt-3">Ressources restantes :</p>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-1">
              <span>{resourceIcons.money} {resources.money}</span>
              <span>{resourceIcons.oxygen} {resources.oxygen}</span>
              <span>{resourceIcons.time} {resources.time}</span>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <h3 className="text-xl font-bold mb-4 text-[#4682B4]">Instructions de l'étape {currentStep}</h3>

          {currentStep === 1 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="rounded-lg p-4 shadow-sm" style={{ backgroundColor: instructionsBgColor }}>
                  <h4 className="font-bold text-lg mb-2 text-[#4682B4]">📝 Instructions</h4>
                  <ol className="list-decimal ml-5 space-y-2 text-[#333]">
                    <li>Ouvrez le sac n°1 : vous y trouverez une carte de la ville avec 3 chemins (piéton, vélo, transport en commun), ainsi que des étiquettes représentant des panneaux de signalisation.</li>
                    <li>Suivez le chemin correspondant à votre moyen de transport.</li>
                    <li>Sur ce chemin, vous rencontrerez 10 bulles indiquant des types de panneaux.</li>
                    <li>Cherchez les 10 panneaux correspondant aux bulles sur votre chemin.</li>
                    <li>Additionnez les nombres inscrits sur ces panneaux pour obtenir votre code.</li>
                  </ol>
                </div>
                <div className="rounded-lg p-4 shadow-sm" style={{ backgroundColor: tipsBgColor }}>
                  <h4 className="font-bold text-lg mb-2 text-orange-700">💡 Astuces</h4>
                  <ul className="list-disc ml-5 space-y-2 text-gray-700">
                    <li>Assurez-vous d'avoir trouvé 10 panneaux.</li>
                    <li>Vérifiez que vous êtes bien sur le bon chemin.</li>
                    <li>Attention, certains panneaux se ressemblent !</li>
                  </ul>
                  <div className="flex flex-wrap justify-around items-start text-center gap-4 mt-4 pt-4 border-t border-yellow-300">
                    <div className="flex flex-col items-center w-1/5">
                      <DangerIcon className="w-12 h-12 mb-1" />
                      <p className="text-xs font-semibold text-gray-700">Danger</p>
                    </div>
                    <div className="flex flex-col items-center w-1/5">
                      <InterdictionIcon className="w-12 h-12 mb-1" />
                      <p className="text-xs font-semibold text-gray-700">Interdiction</p>
                    </div>
                    <div className="flex flex-col items-center w-1/5">
                      <ObligationIcon className="w-12 h-12 mb-1" />
                      <p className="text-xs font-semibold text-gray-700">Obligation</p>
                    </div>
                    <div className="flex flex-col items-center w-1/5">
                      <IndicationIcon className="w-12 h-12 mb-1" />
                      <p className="text-xs font-semibold text-gray-700">Indication</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {currentStep === 2 && (
            <>
              <p className="mb-4 text-[#333]">
                Les Bous ne se sentent pas bien et doivent absolument prendre le bus. Comme ils sont très nombreux,
                il faudra prendre plusieurs bus !
                Mais, attention, il faut faire vite sans rater des informations importantes. Donc, prenons
                les bus qui passent seulement par les villes de notre trajet.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg p-4 shadow-sm" style={{ backgroundColor: instructionsBgColor }}>
                  <h4 className="font-bold text-lg mb-2 text-[#4682B4]">📝 Comment trouver le code</h4>
                  <ol className="list-decimal ml-5 space-y-2 text-[#333]">
                    <li>Ouvrez le sac n°2. Il contient une fiche horaire de bus.</li>
                    <li>Trouvez les bus à prendre.</li>
                    <li>Additionnez les numéros de ces bus pour obtenir le code.</li>
                  </ol>
                </div>
                <div className="rounded-lg p-4 shadow-sm" style={{ backgroundColor: tipsBgColor }}>
                  <h4 className="font-bold text-lg mb-2 text-orange-700">💡 Astuces</h4>
                  <ul className="list-disc ml-5 space-y-2 text-gray-700">
                    <li>Utilisez la carte de la région pour identifier les villes du trajet.</li>
                    <li>Éliminez les bus qui s'arrêtent dans des villes en dehors de notre trajet.</li>
                    <li>Éliminez les bus qui ne s'arrêtent pas dans toutes les villes du trajet.</li>
                    <li>Vous pouvez écrire sur la fiche horaire.</li>
                  </ul>
                </div>
              </div>
            </>
          )}

          {currentStep === 3 && (
            <div className="rounded-lg p-4 shadow-sm" style={{ backgroundColor: instructionsBgColor }}>
              <h4 className="font-bold text-lg mb-2 text-[#4682B4]">🤯 Instructions</h4>
               <p className="mb-4 text-[#333]">
                 Nous avons une liste de tâches bizarres à faire. Restons vigilants : Elles sont peut-être très importantes !
               </p>
               <ol className="list-decimal space-y-2 ml-5 text-[#333]">
                 <li>📄 Préparez : une <strong>feuille</strong>, un <strong>stylo</strong> et votre <strong>téléphone</strong>.</li>
                 <li>🚍 <strong>Bus :</strong> Ouvrez l'appli/site <strong>Divia</strong>. Trouvez l'heure du prochain bus <strong>Place du 30 Octobre ➡️ Gare SNCF</strong>. Notez l'heure de départ et d'arrivée.</li>
                 <li>🚆 <strong>Train :</strong> Ouvrez l'appli/site <strong>SNCF Connect</strong>. Trouvez l'heure du prochain train <strong>Dijon ➡️ Besançon</strong>. Notez l'heure de départ et d'arrivée.</li>
                 <li>🚌 <strong>Car :</strong> Ouvrez l'appli/site <strong>Mobigo</strong>. Trouvez un car <strong>Besançon (Centre St-Pierre) ➡️ Vesoul (Pôle Multimodal - Gare)</strong>. Notez l'heure de départ et d'arrivée.</li>
                 <li>🚗 <strong>Covoiturage :</strong> Ouvrez l'appli/site <strong>Blablacar</strong>. Trouvez un trajet <strong>Vesoul ➡️ Dijon</strong> et notez l'heure du premier départ proposé.</li>
                 <li>✏️ Écrivez les prénoms de votre équipe en haut à gauche de la feuille.</li>
                 <li>🥸 Sac n°3 :
                    <ul className="list-disc ml-5 mt-1">
                      <li>Une personne met les lunettes.</li>
                      <li>Faites une boulette avec la feuille.</li>
                      <li><strong>Réussisez un panier chacun</strong> (2m de distance).</li>
                      <li>Allez voir le Gardien des Ressources <strong>pour obtenir un indice très précieux</strong>.</li>
                    </ul>
                 </li>
                 <li>🤖 Trouvez Aurélie et demandez-lui un code secret. Notez le code !</li>
                 <li>🚫 Oubliez tout ce qui précède.</li>
                 <li>🗺️ Le Chaudron d'Infinité est à Mâcon. Trouver cette ville sur la carte et notez son numéro dans la case suivante.</li>
                 <li>🛑 Ne faites que ce qui précède. Oubliez le reste.</li>
                 <li>🐺 Dansez avec les loups !</li>
                 <li>🐴 De quelle couleur était le cheval blanc d'Henri IV ?</li>
                 <li>📝 Relisez attentivement votre feuille !</li>
               </ol>
            </div>
          )}

          {currentStep === 4 && (
            <>
              <p className="mb-4 text-[#333]">
                Pour trouver le portail, vous devez déchiffrer un message codé.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  <div className="rounded-lg p-4 shadow-sm lg:col-span-1" style={{ backgroundColor: instructionsBgColor }}>
                     <h4 className="font-bold text-lg mb-2 text-[#4682B4]">📝 Instructions</h4>
                     <ol className="list-decimal ml-5 space-y-2 text-[#333]">
                        <li>Ouvrez le sac n°4, vous y trouverez un parchemin.</li>
                        <li>Déchiffrez le message sur le parchemin.</li>
                        <li>Trouvez le lieu indiqué par le message.</li>
                        <li>Entrez le code correspondant à ce lieu.</li>
                     </ol>
                  </div>
                  <div className="rounded-lg p-4 shadow-sm" style={{ backgroundColor: tipsBgColor }}>
                     <h4 className="font-bold text-lg mb-2 text-orange-700">💡 Astuces</h4>
                     <ul className="list-disc ml-5 space-y-2 text-gray-700">
                        <li>Étudiez attentivement le parchemin</li>
                        <li>Cliquez sur les images ci-dessous pour en savoir plus sur les emplacements !</li>
                     </ul>
                  </div>
                  <div className="rounded-lg p-4 shadow-sm" style={{ backgroundColor: warningBgColor }}>
                      <h4 className="font-bold text-lg mb-2 text-red-700">⚠️ Attention</h4>
                      <p className="text-red-700">
                         Vous n'avez qu'<span className="font-bold">une seule tentative</span>. En cas d'échec, les Bous ne pourront pas rentrer chez eux !
                      </p>
                  </div>
              </div>
              <h4 className="text-lg font-bold mt-6 mb-3 text-[#4682B4]">Lieux Possibles</h4>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(portalChoices).map(([code, { name, image }]) => (
                  <div key={code} className="text-center border border-gray-200 rounded-lg p-2 cursor-pointer hover:shadow-md"
                    onClick={() => openPortalModal(code)}>
                    <p className="mb-2 font-semibold">{code} - {name}</p>
                    <img src={image || `https://via.placeholder.com/150/CCCCCC/333333?text=${name.substring(0,10)}...`} alt={name} className="w-full h-40 object-cover rounded-lg"/>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {showCodeInput && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-4">
            <h3 className="text-lg font-bold mb-4 text-[#4682B4]">Entrez le code</h3>
            <div className="flex flex-col gap-4">
              <input type="text" value={inputCode} onChange={(e) => setInputCode(e.target.value)} placeholder="Entrez le code ici" className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg"/>
              <button onClick={checkCode} className="w-full bg-[#5cb85c] text-white py-4 rounded-lg text-xl font-bold hover:bg-[#4cae4c] transition-colors">Vérifier le code</button>
            </div>
          </div>
        )}

        {showFinalConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 sm:p-8 max-w-md w-full mx-auto shadow-xl">
               <h2 className="text-2xl font-bold text-[#d9534f] mb-4 text-center">⚠️ Attention !</h2>
               <p className="text-base sm:text-lg mb-6 text-center">
                   Vous êtes sur le point d'entrer le code final pour le portail magique.
                   Cette action est irréversible et vous n'aurez qu'une seule tentative.
                   Si le code est incorrect, les Bous ne pourront pas rentrer chez eux.
               </p>
               <p className="text-lg font-bold mb-6 text-center">
                   Êtes-vous absolument sûr du code <span className="text-[#4682B4]">{inputCode}</span> ?
               </p>
               <div className="flex gap-4">
                   <button onClick={() => setShowFinalConfirmation(false)} className="flex-1 h-12 bg-gray-500 text-white rounded-lg font-bold hover:bg-gray-600 transition-colors">Annuler</button>
                   <button onClick={confirmFinalCode} className="flex-1 h-12 bg-[#d9534f] text-white rounded-lg font-bold hover:bg-[#c9302c] transition-colors">Confirmer</button>
               </div>
            </div>
          </div>
        )}

        {showPortalModal && selectedPortalCode && portalChoices[selectedPortalCode as PortalCodeType] && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full overflow-y-auto max-h-[90vh]">
              <h2 className="text-2xl font-bold text-[#4682B4] mb-4 text-center">{portalChoices[selectedPortalCode as PortalCodeType].name}</h2>
              <img src={portalChoices[selectedPortalCode as PortalCodeType].image || `https://via.placeholder.com/400/CCCCCC/333333?text=${portalChoices[selectedPortalCode as PortalCodeType].name}`} alt={portalChoices[selectedPortalCode as PortalCodeType].name} className="w-full h-64 object-cover rounded-lg mb-4 border border-gray-200"/>
              <p className="text-[#333] mb-4 text-center">{portalChoices[selectedPortalCode as PortalCodeType].description}</p>
              <p className="text-center text-lg font-semibold text-[#708090] mb-6">Code associé : <span className="text-[#4682B4]">{selectedPortalCode}</span></p>
              <button onClick={closePortalModal} className="w-full bg-[#708090] text-white py-3 px-6 rounded-lg text-lg font-bold hover:bg-[#5a6874]">Fermer</button>
            </div>
          </div>
        )}

      </div>
    );
  }

  // Fonction pour calculer et afficher le récapitulatif
  const renderVehicleSummary = () => {
    if (vehicleHistory.length === 0) {
      return <p className="text-gray-600 mt-4">Aucun voyage effectué pendant cette partie.</p>;
    }

    const cumulativeCosts = vehicleHistory.reduce(
      (totals, vehicleKey) => {
        const vehicleData = vehicles[vehicleKey];
        if (vehicleData) {
          totals.money += vehicleData.money;
          totals.oxygen += vehicleData.oxygen;
          totals.time += vehicleData.time;
        }
        return totals;
      },
      { money: 0, oxygen: 0, time: 0 }
    );

    return (
      <div className="mt-8 p-4 border border-gray-300 rounded-lg bg-gray-50 w-full max-w-lg mx-auto">
        <h3 className="text-lg font-bold text-center mb-4 text-[#4682B4]">Récapitulatif des voyages</h3>
        <div className="mb-3 text-center">
            <span className="font-semibold">Véhicules utilisés :</span>{' '}
            {vehicleHistory.map((key, index) => (
                <span key={index} title={vehicles[key]?.name} className="text-2xl mx-1">
                    {vehicles[key]?.icon || '?'}
                </span>
            ))}
        </div>
        <div className="text-center space-y-1">
          <p className="text-gray-700">
            <span className="font-semibold">Coût total :</span>
          </p>
          <p className="text-gray-700">
            {resourceIcons.money} {cumulativeCosts.money} {resourceNamesFR.money}
          </p>
          <p className="text-gray-700">
            {resourceIcons.oxygen} {cumulativeCosts.oxygen} {resourceNamesFR.oxygen}
          </p>
          <p className="text-gray-700">
            {resourceIcons.time} {cumulativeCosts.time} {resourceNamesFR.time}
          </p>
        </div>
      </div>
    );
  };

  // Page Victoire
  if (currentPage === 'victory') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-4xl font-bold text-[#5cb85c] mb-4">Félicitations !</h1>
        <p className="text-xl text-[#333] mb-6">
          Vous avez réussi à activer le portail magique ! Les Bous vous remercient infiniment.
          Grâce à vous, ils vont pouvoir rentrer chez eux.
        </p>
        <img src="https://cdn.midjourney.com/1ce19a5c-363e-4637-9ae2-15a210886198/0_0.png" alt="Victoire" className="w-64 h-64 sm:w-80 sm:h-80 object-contain mb-6 rounded-lg shadow-lg"/>
        <button onClick={resetGame} className="bg-[#4682B4] text-white py-3 px-8 rounded-lg text-xl font-bold hover:bg-[#3a6d96] transition-colors">Rejouer !</button>
        {renderVehicleSummary()}
      </div>
    );
  }

  // Page Game Over
  if (currentPage === 'gameover') {
    let reasonMessage = '';
    if (gameOverReason === 'resources') {
        reasonMessage = "Hélas, vous n'aviez plus assez de ressources pour continuer l'aventure... Les Bous ne pourront jamais rentrer chez eux.";
    } else if (gameOverReason === 'portal') {
        reasonMessage = "Hélas, vous vous êtes trompé.e de portail... Les Bous ne pourront jamais rentrer chez eux.";
    } else if (gameOverReason === 'time') {
        reasonMessage = "Hélas, le temps imparti est écoulé... Les Bous ne pourront jamais rentrer chez eux.";
    } else {
        reasonMessage = "Hélas, l'aventure s'arrête ici pour les Bous...";
    }

    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-4xl font-bold text-[#d9534f] mb-4">Game Over!</h1>
        <p className="text-xl text-[#333] mb-6">
          {reasonMessage}
        </p>
        <img src="https://cdn.midjourney.com/011688bc-c565-48d2-ba74-9f2d91c38bf8/0_0.png" alt="Game Over" className="w-64 h-64 sm:w-80 sm:h-80 object-contain mb-6 rounded-lg shadow-lg"/>
        <button onClick={resetGame} className="bg-[#4682B4] text-white py-3 px-8 rounded-lg text-xl font-bold hover:bg-[#3a6d96] transition-colors">Rejouer !</button>
        {renderVehicleSummary()}
      </div>
    );
  }

  // --- PAGE DE JEU PRINCIPALE (par défaut) ---
  return (
    <div className="min-h-screen bg-white p-4">
       {renderHeader()}

       {/* Modale de célébration d'étape */}
       {showCelebration && rewards && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-lg p-6 sm:p-8 max-w-md w-full mx-auto shadow-xl">
             <h2 className="text-2xl font-bold text-[#4682B4] mb-4 text-center">🎉 Nouvelle Quête Débloquée !</h2>
             <p className="text-lg text-center mb-6">{celebrationMessage}</p>
             <div className="bg-[#e6f7ff] rounded-lg p-4 mb-6">
               <h3 className="text-xl font-bold text-[#4682B4] mb-4 text-center">Récompenses</h3>
               <div className="grid grid-cols-3 gap-4 text-center">
                 <div className="bg-white rounded-lg p-2"><p className="text-2xl mb-2">{resourceIcons.money}</p><p className="font-bold text-[#4682B4]">+{rewards.money}</p><p className="text-sm text-[#708090]">{resourceNamesFR.money}</p></div>
                 <div className="bg-white rounded-lg p-2"><p className="text-2xl mb-2">{resourceIcons.oxygen}</p><p className="font-bold text-[#4682B4]">+{rewards.oxygen}</p><p className="text-sm text-[#708090]">{resourceNamesFR.oxygen}</p></div>
                 <div className="bg-white rounded-lg p-2"><p className="text-2xl mb-2">{resourceIcons.time}</p><p className="font-bold text-[#4682B4]">+{rewards.time}</p><p className="text-sm text-[#708090]">{resourceNamesFR.time}</p></div>
               </div>
             </div>
             <button onClick={() => setShowCelebration(false)} className="w-full bg-[#5cb85c] text-white py-4 rounded-lg text-xl font-bold hover:bg-[#4cae4c] transition-colors">Continuer l'aventure</button>
           </div>
         </div>
       )}

        {/* Modale de blocage */}
        {showNoMovesModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl p-6 sm:p-8 max-w-md w-full mx-auto shadow-xl">
                <h2 className="text-2xl font-bold text-[#d9534f] mb-4 text-center">🛑 Aventure Bloquée !</h2>
                <p className="text-base sm:text-lg mb-6 text-center">
                    Malheureusement, vous n'avez plus assez de ressources pour acheter un moyen de transport, même en effectuant tous les échanges possibles. L'aventure s'arrête ici pour les Bous...
                </p>
                <p className="text-lg font-bold mb-6 text-center">Confirmez-vous l'abandon de la mission ?</p>
                <div className="flex gap-4">
                    <button onClick={handleConfirmNoMoves} className="w-full h-12 bg-[#d9534f] text-white rounded-lg font-bold hover:bg-[#c9302c] transition-colors">Confirmer l'abandon</button>
                </div>
                </div>
            </div>
        )}


       {/* Contenu principal de la page de jeu */}
       <div className="bg-[#f5f5f5] rounded-lg shadow-md p-4 mb-4">
         <h2 className="text-xl font-bold mb-4 text-[#4682B4]">
           Étape {currentStep}:
           {currentStep === 1 && " La Quête du Bâton d'Ubiquité"}
           {currentStep === 2 && " La Quête de la Sphère de Vision"}
           {currentStep === 3 && " La Quête du Chaudron d'Infinité"}
           {currentStep === 4 && " La Quête du Portail Magique"}
         </h2>
         <div className="bg-[#e6f7ff] rounded p-3 mb-4">
           {currentStep === 1 && <p className="text-[#333]">Le premier objet magique est le Bâton d'Ubiquité, une baguette magique qui permet d'être à plusieurs endroits en même temps. <span className="font-semibold">Choisissez comment vous voulez vous déplacer pendant cette quête !</span></p>}
           {currentStep === 2 && <p className="text-[#333]">Le deuxième objet magique est la Sphère de Vision, une boule en cristal décorée d'or. Elle permet de voir à travers le temps et l'espace. <span className="font-semibold">Choisissez comment vous voulez vous déplacer pendant cette quête !</span></p>}
           {currentStep === 3 && <p className="text-[#333]">Le dernier objet à trouver est le Chaudron d'Infinité. Il permet de fabriquer la Clé du Portail, qui combine les pouvoirs du Bâton d'Ubiquité et de la Sphère de Vision. <span className="font-semibold">Choisissez comment vous voulez vous déplacer pendant cette quête !</span></p>}
           {currentStep === 4 && <p className="text-[#333]">Maintenant que vous avez les trois objets, vous pouvez trouver le portail magique ! Choisissez judicieusement votre destination finale.</p>}
         </div>
         <div className="grid grid-cols-3 gap-6 mb-6 bg-white rounded-xl p-6">
           {Object.entries(inventoryItems).map(([key, item]) => (
             <div key={key} className={`flex flex-col items-center p-6 rounded-xl transition-all transform hover:scale-105 ${inventory[key as keyof typeof inventory] ? 'bg-[#5cb85c] bg-opacity-15 border-2 border-[#5cb85c]' : 'bg-[#f5f5f5] border-2 border-transparent'}`}>
               <div className="text-4xl mb-3">{item.icon}</div>
               <h3 className="text-lg font-bold text-[#333] mb-2 text-center">{item.name}</h3>
               <p className="text-sm text-[#666] text-center">{item.description}</p>
               <div className="mt-3">
                 {inventory[key as keyof typeof inventory] ? <CheckIcon /> : <CrossIcon />}
               </div>
             </div>
           ))}
         </div>
       </div>

       <div className="bg-white rounded-lg shadow-md p-4 mb-4">
         <h3 className="text-lg font-bold mb-2 text-[#4682B4]">Ressources</h3>
         <div className="flex flex-wrap justify-around mb-4 gap-x-4 font-bold">
           <p className="text-[#333]">{resourceIcons.money} {resourceNamesFR.money}: {resources.money}</p>
           <p className="text-[#333]">{resourceIcons.oxygen} {resourceNamesFR.oxygen}: {resources.oxygen}</p>
           <p className="text-[#333]">{resourceIcons.time} {resourceNamesFR.time}: {resources.time}</p>
         </div>
         <h4 className="text-md font-bold mb-2 text-[#4682B4]">Échanger des ressources</h4>
         {/* Texte des boutons mis à jour */}
         <div className="grid grid-cols-2 gap-2">
           <button onClick={() => exchangeResources('money', 'oxygen')} className="bg-[#4682B4] text-white p-2 rounded hover:bg-[#3a6d96]">100 {resourceIcons.money} ➡️ 10 {resourceIcons.oxygen}</button>
           <button onClick={() => exchangeResources('money', 'time')} className="bg-[#4682B4] text-white p-2 rounded hover:bg-[#3a6d96]">100 {resourceIcons.money} ➡️ 10 {resourceIcons.time}</button>
           <button onClick={() => exchangeResources('time', 'money')} className="bg-[#4682B4] text-white p-2 rounded hover:bg-[#3a6d96]">100 {resourceIcons.time} ➡️ 10 {resourceIcons.money}</button>
           <button onClick={() => exchangeResources('oxygen', 'time')} className="bg-[#4682B4] text-white p-2 rounded hover:bg-[#3a6d96]">20 {resourceIcons.oxygen} ➡️ 10 {resourceIcons.time}</button>
         </div>
       </div>

       {!currentVehicle && (
         <div className="bg-white rounded-lg shadow-md p-4 mb-4">
           <h3 className="text-lg font-bold mb-4 text-[#4682B4]">Choisir un moyen de transport</h3>
           <div className="grid grid-cols-2 gap-2">
             {Object.entries(vehicles).map(([key, vehicle]) => {
               const isAvailable = !vehicle.availableFromStep || currentStep >= vehicle.availableFromStep;
               const canAffordDirectly = resources.money >= vehicle.money && resources.oxygen >= vehicle.oxygen && resources.time >= vehicle.time;
               const buttonClass = `p-3 rounded-lg border flex flex-col items-center justify-between ${
                    !isAvailable
                        ? 'bg-gray-300 border-gray-400 text-gray-500 cursor-not-allowed opacity-60'
                        : canAffordDirectly
                            ? 'bg-[#f5f5f5] border-[#ddd] hover:bg-[#e6f7ff]'
                            : 'bg-gray-100 border-gray-300 text-gray-500 opacity-80'
               }`;

               return (
                 <button key={key} className={buttonClass} onClick={() => isAvailable && buyVehicle(key)} disabled={!isAvailable}>
                   <div className="flex items-center mb-2">
                     <span className="mr-2 text-lg">{vehicle.icon}</span>
                     <span className={`font-bold ${isAvailable ? (canAffordDirectly ? 'text-[#777]' : 'text-gray-600') : ''}`}>{vehicle.name}</span>
                   </div>
                   <div className="text-sm">
                     <p className={isAvailable ? (canAffordDirectly ? 'text-[#777]' : 'text-gray-500') : ''}>{resourceIcons.money} {vehicle.money}</p>
                     <p className={isAvailable ? (canAffordDirectly ? 'text-[#777]' : 'text-gray-500') : ''}>{resourceIcons.oxygen} {vehicle.oxygen}</p>
                     <p className={isAvailable ? (canAffordDirectly ? 'text-[#777]' : 'text-gray-500') : ''}>{resourceIcons.time} {vehicle.time}</p>
                   </div>
                   {!isAvailable && vehicle.availableFromStep && (
                     <p className="text-xs text-red-500 mt-1">Dispo. étape {vehicle.availableFromStep}</p>
                   )}
                 </button>
               );
             })}
           </div>
         </div>
       )}

       {message && (
         <div className={`rounded-lg border-l-4 p-4 mb-4 ${message.includes('incorrect') || message.includes("Pas assez") || message.includes("insuffisantes") ? 'bg-red-100 border-red-500 text-red-700' : 'bg-[#e6f7ff] border-[#4682B4] text-[#4682B4]'}`}>
           <p>{message}</p>
         </div>
       )}

       {showCodeInput && currentPage === 'game' && (
         <div className="bg-white rounded-lg shadow-md p-4 mb-4">
           <h3 className="text-lg font-bold mb-4 text-[#4682B4]">Entrez le code</h3>
           <div className="flex flex-col gap-4">
             <input type="text" value={inputCode} onChange={(e) => setInputCode(e.target.value)} placeholder="Entrez le code ici" className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg"/>
             <button onClick={checkCode} className="w-full bg-[#5cb85c] text-white py-4 rounded-lg text-xl font-bold hover:bg-[#4cae4c] transition-colors">Vérifier le code</button>
           </div>
         </div>
       )}

      {showVehicleConfirmation && vehicleToConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 sm:p-8 max-w-md w-full mx-auto shadow-xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="text-5xl sm:text-6xl">{vehicles[vehicleToConfirm].icon}</div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#4682B4]">{vehicles[vehicleToConfirm].name}</h2>
                <p className="text-sm sm:text-base text-[#708090]">Confirmer la sélection</p>
              </div>
            </div>
            <div className="bg-[#f5f5f5] rounded-lg p-4 mb-6">
              <h3 className="font-bold text-[#4682B4] mb-3">Coût du voyage</h3>
              <div className="space-y-2 text-sm sm:text-base">
                <div className="flex justify-between items-center"><span>{resourceIcons.money} {resourceNamesFR.money}</span><span className="font-bold">{vehicles[vehicleToConfirm].money}</span></div>
                <div className="flex justify-between items-center"><span>{resourceIcons.oxygen} {resourceNamesFR.oxygen}</span><span className="font-bold">{vehicles[vehicleToConfirm].oxygen}</span></div>
                <div className="flex justify-between items-center"><span>{resourceIcons.time} {resourceNamesFR.time}</span><span className="font-bold">{vehicles[vehicleToConfirm].time}</span></div>
              </div>
            </div>
            <div className="mb-8">
              <h3 className="font-bold text-[#4682B4] mb-3">Ressources restantes après voyage</h3>
              <div className="space-y-3">
                {(['money', 'oxygen', 'time'] as const).map(resKey => {
                  const cost = vehicles[vehicleToConfirm][resKey];
                  const remaining = resources[resKey] - cost;
                  const initialForStep = resourcesAtStepStart[resKey];
                  const percentage = initialForStep > 0 ? Math.max(0, (remaining / initialForStep) * 100) : 0;
                  const isLow = initialForStep > 0 ? (remaining / initialForStep) < 0.2 : (remaining <= 0);
                  const insufficient = remaining < 0;

                  return (
                    <div key={resKey}>
                      <div className="flex justify-between mb-1 text-sm sm:text-base">
                        <span>{resourceIcons[resKey]} {resourceNamesFR[resKey]}</span>
                        <span className={`${insufficient ? 'text-red-600 font-bold' : ''}`}>{remaining}</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 rounded-full ${
                            insufficient ? 'bg-red-600' : (isLow ? 'bg-orange-400' : 'bg-[#4682B4]')
                          }`}
                          style={{ width: `${insufficient ? 100 : percentage}%` }}
                        ></div>
                      </div>
                      {insufficient && <p className="text-xs text-red-600 mt-1">Ressources insuffisantes !</p>}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex gap-3 sm:gap-4">
              <button onClick={() => {setShowVehicleConfirmation(false); setVehicleToConfirm(null);}} className="flex-1 h-11 sm:h-12 bg-gray-500 text-white rounded-lg font-bold hover:bg-gray-600 transition-colors text-sm sm:text-base">Annuler</button>
              <button onClick={() => confirmVehicle(vehicleToConfirm!)} disabled={resources.money < vehicles[vehicleToConfirm].money || resources.oxygen < vehicles[vehicleToConfirm].oxygen || resources.time < vehicles[vehicleToConfirm].time} className={`flex-1 h-11 sm:h-12 text-white rounded-lg font-bold transition-colors text-sm sm:text-base ${(resources.money < vehicles[vehicleToConfirm].money || resources.oxygen < vehicles[vehicleToConfirm].oxygen || resources.time < vehicles[vehicleToConfirm].time) ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#5cb85c] hover:bg-[#4cae4c]'}`}>Confirmer</button>
            </div>
          </div>
        </div>
      )}


      {showExchangeConfirmation && exchangeDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 sm:p-8 max-w-md w-full mx-auto shadow-xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="text-5xl sm:text-6xl">🔄</div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#4682B4]">Confirmer l'échange</h2>
                <p className="text-sm sm:text-base text-[#708090]">Échanger des ressources</p>
              </div>
            </div>
            <div className="bg-[#f5f5f5] rounded-lg p-4 mb-6">
              <h3 className="font-bold text-[#4682B4] mb-3">Détails de l'échange</h3>
              <div className="space-y-2 text-sm sm:text-base text-center">
                <p>Échanger <span className="font-bold">{exchangeDetails.amountFrom}</span> {resourceIcons[exchangeDetails.from]} ({exchangeDetails.fromResourceFR})</p>
                <p>contre <span className="font-bold">{exchangeDetails.amountTo}</span> {resourceIcons[exchangeDetails.to]} ({exchangeDetails.toResourceFR})</p>
              </div>
            </div>
            <div className="mb-8">
              <h3 className="font-bold text-[#4682B4] mb-3">Ressources après échange</h3>
              <div className="space-y-3">
                {(['money', 'oxygen', 'time'] as const).map(resKey => {
                  const currentAmount = resources[resKey];
                  let finalAmount = currentAmount;
                  if (resKey === exchangeDetails.from) { finalAmount -= exchangeDetails.amountFrom; }
                  if (resKey === exchangeDetails.to) { finalAmount += exchangeDetails.amountTo; }
                  const relevantMax = Math.max(currentAmount, finalAmount);
                  const percentage = relevantMax > 0 ? Math.max(0, (finalAmount / relevantMax) * 100) : 0;
                  const currentPercentage = relevantMax > 0 ? Math.max(0, (currentAmount / relevantMax) * 100) : 0;
                  const isLow = relevantMax > 0 ? (finalAmount / relevantMax) < 0.2 : (finalAmount <= 0);
                  const insufficient = resources[exchangeDetails.from] < exchangeDetails.amountFrom;
                  const isAffected = resKey === exchangeDetails.from || resKey === exchangeDetails.to;

                  return (
                    <div key={resKey}>
                      <div className="flex justify-between mb-1 text-sm sm:text-base">
                        <span>{resourceIcons[resKey]} {resourceNamesFR[resKey]}</span>
                        <span className={`${(insufficient && resKey === exchangeDetails.from) ? 'text-red-600 font-bold' : ''}`}>
                           {isAffected
                               ? (resKey === exchangeDetails.from
                                   ? `${finalAmount} ← ${currentAmount}`
                                   : `${currentAmount} → ${finalAmount}`
                                 )
                               : currentAmount
                           }
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                           className={`h-full transition-all duration-300 rounded-full ${
                              (insufficient && resKey === exchangeDetails.from)
                                 ? 'bg-red-600'
                                 : (isLow && finalAmount >= 0)
                                    ? 'bg-orange-400'
                                    : (finalAmount < 0)
                                       ? 'bg-red-600'
                                       : 'bg-[#4682B4]'
                           }`}
                           style={{ width: `${(insufficient && resKey === exchangeDetails.from) ? currentPercentage : percentage}%` }}>
                        </div>
                      </div>
                      {insufficient && resKey === exchangeDetails.from && <p className="text-xs text-red-600 mt-1">Ressources insuffisantes pour cet échange !</p>}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex gap-3 sm:gap-4">
              <button onClick={() => {setShowExchangeConfirmation(false); setExchangeDetails(null);}} className="flex-1 h-11 sm:h-12 bg-gray-500 text-white rounded-lg font-bold hover:bg-gray-600 transition-colors text-sm sm:text-base">Annuler</button>
              <button onClick={confirmExchange} disabled={resources[exchangeDetails.from] < exchangeDetails.amountFrom} className={`flex-1 h-11 sm:h-12 text-white rounded-lg font-bold transition-colors text-sm sm:text-base ${resources[exchangeDetails.from] < exchangeDetails.amountFrom ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#5cb85c] hover:bg-[#4cae4c]'}`}>Confirmer</button>
            </div>
          </div>
        </div>
      )}

      {showFinalConfirmation && currentPage === 'game' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 sm:p-8 max-w-md w-full mx-auto shadow-xl">
             <h2 className="text-2xl font-bold text-[#d9534f] mb-4 text-center">⚠️ Attention !</h2>
             <p className="text-base sm:text-lg mb-6 text-center">
                 Vous êtes sur le point d'entrer le code final. Cette action est irréversible et vous n'aurez qu'une seule tentative. Si le code est incorrect, les Bous ne pourront pas rentrer chez eux.
             </p>
             <p className="text-lg font-bold mb-6 text-center">Êtes-vous sûr du code <span className="text-[#4682B4]">{inputCode}</span> ?</p>
             <div className="flex gap-4">
                 <button onClick={() => setShowFinalConfirmation(false)} className="flex-1 h-12 bg-gray-500 text-white rounded-lg font-bold hover:bg-gray-600 transition-colors">Annuler</button>
                 <button onClick={confirmFinalCode} className="flex-1 h-12 bg-[#d9534f] text-white rounded-lg font-bold hover:bg-[#c9302c] transition-colors">Confirmer</button>
             </div>
          </div>
        </div>
      )}

      {showPortalModal && selectedPortalCode && portalChoices[selectedPortalCode as PortalCodeType] && currentPage === 'game' && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full overflow-y-auto max-h-[90vh]">
            <h2 className="text-2xl font-bold text-[#4682B4] mb-4 text-center">{portalChoices[selectedPortalCode as PortalCodeType].name}</h2>
            <img src={portalChoices[selectedPortalCode as PortalCodeType].image || `https://via.placeholder.com/400/CCCCCC/333333?text=${portalChoices[selectedPortalCode as PortalCodeType].name}`} alt={portalChoices[selectedPortalCode as PortalCodeType].name} className="w-full h-64 object-cover rounded-lg mb-4 border border-gray-200"/>
            <p className="text-[#333] mb-4 text-center">{portalChoices[selectedPortalCode as PortalCodeType].description}</p>
            <p className="text-center text-lg font-semibold text-[#708090] mb-6">Code associé : <span className="text-[#4682B4]">{selectedPortalCode}</span></p>
            <button onClick={closePortalModal} className="w-full bg-[#708090] text-white py-3 px-6 rounded-lg text-lg font-bold hover:bg-[#5a6874]">Fermer</button>
          </div>
        </div>
      )}

    </div>
  );
};

export default BouJeuApp;
