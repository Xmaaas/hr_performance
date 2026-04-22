import { useParams } from "react-router-dom";

export default function GoalDetails() {
  const { id } = useParams();

  return (
    <div>
      <h2>Cél részletei</h2>
      <p>Cél ID: {id}</p>
    </div>
  );
}

