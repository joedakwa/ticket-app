

const StatusDisplay = ({status}) => {

  const getColor = (status) => {
    let color = "bg-gray-200"
    switch (status.toLowerCase()) {
      case "done":
        color = "bg-green-200"
        break;
      case "in progress":
        color = "bg-yellow-200"
        return color;
        case "not started":
          color = "bg-red-200"
          return color;
    }
          return color;
      
  }



  return (
    <span className={`inline-block rounded-full px-2 py-1 text-xs font-semibold text-gray-700 ${getColor(status)}`}>
        {status}
    </span>
  )
}

export default StatusDisplay