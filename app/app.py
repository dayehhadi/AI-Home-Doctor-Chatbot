from data_processing import load_data, preprocess_data
from models.neural_network import SymptomDiseaseModel
import numpy as np
def main():
    # Load and preprocess data
    symptom_df, description_df, precaution_df, severity_df, testing_symptoms_df = load_data()
    X, y = preprocess_data(symptom_df, testing_symptoms_df)

    # Split data into training and testing sets
    from sklearn.model_selection import train_test_split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

    # Get input shape and number of classes
    input_shape = X_train.shape[1]
    num_classes = y_train.shape[1]

    # Initialize and train the model
    model = SymptomDiseaseModel(input_shape, num_classes)
    model.train(X_train, y_train)

    # Evaluate the model
    loss, accuracy = model.evaluate(X_test, y_test)
    print(f"Test Accuracy: {accuracy * 100:.2f}%")

    # Save the trained model
    model.save_model()

    def encode_user_symptoms(user_symptoms, all_symptoms):
        """
        Converts user symptoms into a binary vector based on all possible symptoms.

        Parameters:
         - user_symptoms (list): List of symptoms provided by the user.
         - all_symptoms (list): List of all possible symptoms the model recognizes.

          Returns:
         - numpy array: Binary vector representing the user's symptoms.
        """
    # Initialize a zero vector
    input_vector = np.zeros(len(all_symptoms))
    # Create a mapping of symptoms to indices for faster lookup
    symptom_to_index = {symptom: idx for idx, symptom in enumerate(all_symptoms)}

    for symptom in user_symptoms:
        symptom = symptom.strip().lower()
        if symptom in symptom_to_index:
            index = symptom_to_index[symptom]
            input_vector[index] = 1
        else:
            print(f"Warning: Symptom '{symptom}' not recognized.")

    # Reshape to match model input shape
    return input_vector.reshape(1, -1)

    # You can add code here to interact with the user or deploy the model
    def user_interaction(model):
        all_symptoms = [
    'itching', 'skin_rash', 'nodal_skin_eruptions', 'continuous_sneezing', 'shivering', 'chills',
    'joint_pain', 'stomach_pain', 'acidity', 'ulcers_on_tongue', 'muscle_wasting', 'vomiting',
    'burning_micturition', 'spotting_ urination', 'fatigue', 'weight_gain', 'anxiety',
    'cold_hands_and_feets', 'mood_swings', 'weight_loss', 'restlessness', 'lethargy',
    'patches_in_throat', 'irregular_sugar_level', 'cough', 'high_fever', 'sunken_eyes',
    'breathlessness', 'sweating', 'dehydration', 'indigestion', 'headache', 'yellowish_skin',
    'dark_urine', 'nausea', 'loss_of_appetite', 'pain_behind_the_eyes', 'back_pain', 'constipation',
    'abdominal_pain', 'diarrhoea', 'mild_fever', 'yellow_urine', 'yellowing_of_eyes',
    'acute_liver_failure', 'fluid_overload', 'swelling_of_stomach', 'swelled_lymph_nodes',
    'malaise', 'blurred_and_distorted_vision', 'phlegm', 'throat_irritation', 'redness_of_eyes',
    'sinus_pressure', 'runny_nose', 'congestion', 'chest_pain', 'weakness_in_limbs',
    'fast_heart_rate', 'pain_during_bowel_movements', 'pain_in_anal_region', 'bloody_stool',
    'irritation_in_anus', 'neck_pain', 'dizziness', 'cramps', 'bruising', 'obesity', 'swollen_legs',
    'swollen_blood_vessels', 'puffy_face_and_eyes', 'enlarged_thyroid', 'brittle_nails',
    'swollen_extremeties', 'excessive_hunger', 'extra_marital_contacts', 'drying_and_tingling_lips',
    'slurred_speech', 'knee_pain', 'hip_joint_pain', 'muscle_weakness', 'stiff_neck',
    'swelling_joints', 'movement_stiffness', 'spinning_movements', 'loss_of_balance',
    'unsteadiness', 'weakness_of_one_body_side', 'loss_of_smell', 'bladder_discomfort',
    'foul_smell_of urine', 'continuous_feel_of_urine', 'passage_of_gases', 'internal_itching',
    'toxic_look_(typhos)', 'depression', 'irritability', 'muscle_pain', 'altered_sensorium',
    'red_spots_over_body', 'belly_pain', 'abnormal_menstruation', 'dischromic _patches',
    'watering_from_eyes', 'increased_appetite', 'polyuria', 'family_history', 'mucoid_sputum',
    'rusty_sputum', 'lack_of_concentration', 'visual_disturbances', 'receiving_blood_transfusion',
    'receiving_unsterile_injections', 'coma', 'stomach_bleeding', 'distention_of_abdomen',
    'history_of_alcohol_consumption', 'fluid_overload', 'blood_in_sputum', 'prominent_veins_on_calf',
    'palpitations', 'painful_walking', 'pus_filled_pimples', 'blackheads', 'scurring',
    'skin_peeling', 'silver_like_dusting', 'small_dents_in_nails', 'inflammatory_nails', 'blister',
    'red_sore_around_nose', 'yellow_crust_ooze'
        ]
        # Load necessary data for symptom encoding
        # For example, a list of all possible symptoms
    # Get user input
        user_input = input("Enter your symptoms separated by commas: ")
        symptoms = [sym.strip().lower() for sym in user_input.split(',')]

    # Encode user symptoms into model input
        X_input = encode_user_symptoms(symptoms, all_symptoms)  # Define this function

    # Predict disease
        prediction = model.predict(X_input)
        predicted_disease = decode_prediction(prediction)  # Define this function

    print(f"The predicted disease is: {predicted_disease}")
# Call this function in main()
    user_interaction(model)

if __name__ == '__main__':
    main()
