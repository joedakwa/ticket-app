import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faExclamationTriangle, faFire } from "@fortawesome/free-solid-svg-icons"

const PriorityDisplay = ({priority}) => {
  return (
    <div className="flex justify-start align-basline">
        <FontAwesomeIcon icon={faFire} className={`pr-1 ${priority > 0 ? "text-red-400" : "text-slate-400"}`} />
        <FontAwesomeIcon icon={faFire} className={`pr-1 ${priority > 1 ? "text-orange-400" : "text-slate-400"}`} />
        <FontAwesomeIcon icon={faFire} className={`pr-1 ${priority > 2 ? "text-yellow-400" : "text-slate-400"}`} />
        <FontAwesomeIcon icon={faFire} className={`pr-1 ${priority > 3 ? "text-green-400" : "text-slate-400"}`} />
        <FontAwesomeIcon icon={faFire} className={`pr-1 ${priority > 4 ? "text-purple-400" : "text-slate-400"}`} />
    </div>
  );
};

export default PriorityDisplay;