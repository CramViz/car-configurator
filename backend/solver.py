from typing import Dict, List, Tuple, Optional, Set
from ortools.sat.python import cp_model


# -----------------------
# Définition du domaine
# -----------------------

VARIABLES = {
    "model": ["civic", "golf", "330i", "x3", "mustang"],
    "engine": ["petrol_1_5", "petrol_2_0", "petrol_3_0", "diesel_2_0", "hybrid"],
    "transmission": ["manual", "automatic"],
    "drivetrain": ["fwd", "rwd", "awd"],
    "color": ["white", "black", "silver", "blue", "red", "gray"],
    "interior": ["cloth", "leather", "premium_leather"],
    "pack": ["base", "sport", "luxury", "amg"],
}

# Description lisible pour l'UI
LABELS = {
    "model": {
        "civic": "Honda Civic",
        "golf": "Volkswagen Golf",
        "330i": "BMW 330i",
        "x3": "BMW X3",
        "mustang": "Ford Mustang",
    },
    "engine": {
        "petrol_1_5": "Essence 1.5L (130 ch)",
        "petrol_2_0": "Essence 2.0L (180 ch)",
        "petrol_3_0": "Essence 3.0L (360 ch)",
        "diesel_2_0": "Diesel 2.0L (150 ch)",
        "hybrid": "Hybride 2.0L",
    },
    "transmission": {
        "manual": "Manuelle 6 vitesses",
        "automatic": "Automatique 8 vitesses",
    },
    "drivetrain": {
        "fwd": "Traction avant (FWD)",
        "rwd": "Propulsion (RWD)",
        "awd": "Transmission intégrale (AWD)",
    },
    "color": {
        "white": "Blanc pur",
        "black": "Noir profond",
        "silver": "Argent métallisé",
        "blue": "Bleu électrique",
        "red": "Rouge vif",
        "gray": "Gris titane",
    },
    "interior": {
        "cloth": "Intérieur tissu",
        "leather": "Cuir standard",
        "premium_leather": "Cuir premium Nappa",
    },
    "pack": {
        "base": "Pack Base",
        "sport": "Pack Sport",
        "luxury": "Pack Luxe",
        "amg": "Pack AMG Performance",
    },
}


def build_index_maps():
    idx = {}
    for var, values in VARIABLES.items():
        idx[var] = {v: i for i, v in enumerate(values)}
    return idx


INDEX = build_index_maps()


def _build_model(assignments: Dict[str, Optional[str]]) -> Tuple[cp_model.CpModel, Dict[str, cp_model.IntVar]]:
    model = cp_model.CpModel()
    vars_int = {}

    # Création des variables CP-SAT (un IntVar par dimension)
    for var_name, domain in VARIABLES.items():
        vars_int[var_name] = model.NewIntVar(0, len(domain) - 1, var_name)

    # Affectations partielles
    for var_name, value in assignments.items():
        if value is None or value == "":
            continue
        if var_name not in VARIABLES:
            continue
        if value not in INDEX[var_name]:
            continue
        model.Add(vars_int[var_name] == INDEX[var_name][value])

    # -------------------------
    # Contraintes métier
    # -------------------------

    m = vars_int["model"]
    e = vars_int["engine"]
    t = vars_int["transmission"]
    d = vars_int["drivetrain"]
    c = vars_int["color"]
    i = vars_int["interior"]
    p = vars_int["pack"]

    # Raccourcis pour indices
    M = INDEX["model"]
    E = INDEX["engine"]
    T = INDEX["transmission"]
    D = INDEX["drivetrain"]
    C = INDEX["color"]
    I = INDEX["interior"]
    P = INDEX["pack"]

    # -------------------------
    # Contraintes métier réalistes
    # -------------------------

    # Honda Civic : moteurs 1.5L ou 2.0L, traction avant, pas de RWD
    model.AddForbiddenAssignments([m, e], [(M["civic"], E["petrol_3_0"]), (M["civic"], E["diesel_2_0"])])
    model.AddForbiddenAssignments([m, d], [(M["civic"], D["rwd"]), (M["civic"], D["awd"])])

    # VW Golf : moteurs 1.5L, 2.0L ou diesel, traction avant principalement
    model.AddForbiddenAssignments([m, e], [(M["golf"], E["petrol_3_0"])])
    model.AddForbiddenAssignments([m, d], [(M["golf"], D["rwd"])])

    # BMW 330i : moteur 2.0L uniquement, RWD ou AWD, automatique obligatoire
    model.AddForbiddenAssignments([m, e], [(M["330i"], E["petrol_1_5"]), (M["330i"], E["petrol_3_0"]), (M["330i"], E["diesel_2_0"]), (M["330i"], E["hybrid"])])
    model.AddForbiddenAssignments([m, d], [(M["330i"], D["fwd"])])
    model.AddForbiddenAssignments([m, t], [(M["330i"], T["manual"])])

    # BMW X3 : moteur 2.0L ou 3.0L, AWD obligatoire, automatique
    model.AddForbiddenAssignments([m, e], [(M["x3"], E["petrol_1_5"]), (M["x3"], E["diesel_2_0"]), (M["x3"], E["hybrid"])])
    model.AddForbiddenAssignments([m, d], [(M["x3"], D["fwd"]), (M["x3"], D["rwd"])])
    model.AddForbiddenAssignments([m, t], [(M["x3"], T["manual"])])

    # Ford Mustang : moteur 3.0L ou 2.0L, RWD ou AWD, automatique conseillé
    model.AddForbiddenAssignments([m, e], [(M["mustang"], E["petrol_1_5"]), (M["mustang"], E["diesel_2_0"]), (M["mustang"], E["hybrid"])])
    model.AddForbiddenAssignments([m, d], [(M["mustang"], D["fwd"])])

    # Moteur 3.0L : seulement BMW X3 et Mustang
    for model_name, m_idx in M.items():
        if model_name not in ("x3", "mustang"):
            model.AddForbiddenAssignments([m, e], [(m_idx, E["petrol_3_0"])])

    # Diesel : uniquement VW Golf
    for model_name, m_idx in M.items():
        if model_name != "golf":
            model.AddForbiddenAssignments([m, e], [(m_idx, E["diesel_2_0"])])

    # Hybride : uniquement Civic et Golf
    for model_name, m_idx in M.items():
        if model_name not in ("civic", "golf"):
            model.AddForbiddenAssignments([m, e], [(m_idx, E["hybrid"])])

    # Pack AMG : seulement BMW 330i et X3
    for model_name, m_idx in M.items():
        if model_name not in ("330i", "x3"):
            model.AddForbiddenAssignments([m, p], [(m_idx, P["amg"])])

    # Cuir premium : incompatible avec pack base
    model.AddForbiddenAssignments([i, p], [(I["premium_leather"], P["base"])])

    # AWD : toujours automatique
    model.AddForbiddenAssignments([d, t], [(D["awd"], T["manual"])])

    return model, vars_int


class DomainCollector(cp_model.CpSolverSolutionCallback):
    def __init__(self, variables: Dict[str, cp_model.IntVar]):
        super().__init__()
        self._vars = variables
        self.domains: Dict[str, Set[int]] = {name: set() for name in variables}

    def on_solution_callback(self):
        for name, var in self._vars.items():
            self.domains[name].add(self.Value(var))


def propagate_domains(assignments: Dict[str, Optional[str]]):
    """
    Retourne, pour chaque variable, l'ensemble des valeurs encore possibles
    en tenant compte des contraintes ET des affectations partielles.
    """
    model, vars_int = _build_model(assignments)
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 5.0
    solver.parameters.num_search_workers = 8

    # Pour chaque variable et chaque valeur possible, on teste s'il existe
    # au moins une solution complète en ajoutant la contrainte var == value.
    # C'est plus simple et robuste que SearchForAllSolutions pour obtenir
    # les domaines accessibles (taille du problème très réduite ici).
    domains: Dict[str, List[str]] = {name: [] for name in VARIABLES}
    is_consistent = False

    for var_name, values in VARIABLES.items():
        for idx in range(len(values)):
            # Reconstruire un modèle propre pour chaque test
            test_model, test_vars = _build_model(assignments)
            test_model.Add(test_vars[var_name] == idx)

            test_solver = cp_model.CpSolver()
            test_solver.parameters.max_time_in_seconds = 0.5
            test_solver.parameters.num_search_workers = 8

            status = test_solver.Solve(test_model)
            if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
                domains[var_name].append(values[idx])
                is_consistent = True

    return domains, is_consistent


def solve_configuration(assignments: Dict[str, Optional[str]]):
    """
    Tente de trouver une configuration complète compatible avec les choix partiels.
    """
    model, vars_int = _build_model(assignments)
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 5.0
    solver.parameters.num_search_workers = 8

    status = solver.Solve(model)

    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        return None, "INFEASIBLE"

    # Récupération d'une solution
    result: Dict[str, str] = {}
    for var_name, var in vars_int.items():
        idx = solver.Value(var)
        result[var_name] = VARIABLES[var_name][idx]

    return result, "FEASIBLE"
