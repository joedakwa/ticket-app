import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faExclamationTriangle, faFire } from "@fortawesome/free-solid-svg-icons"

const PriorityDisplay = () => {
  return (
    <div className="flex justify-start align-basline">
        <FontAwesomeIcon icon={faFire} className="text-red-400" />
        <FontAwesomeIcon icon={faFire} className="text-orange-400" />
        <FontAwesomeIcon icon={faFire} className="text-yellow-400" />
        <FontAwesomeIcon icon={faFire} className="text-green-400" />
    </div>
  );
};

export default PriorityDisplay;