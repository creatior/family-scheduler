from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.generics import RetrieveUpdateDestroyAPIView
from .serializers import *
from django.contrib.auth import authenticate
from django.utils import timezone
from django.db import models
from datetime import datetime, timedelta
from .models import *

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)

class RegisterAPI(generics.GenericAPIView):
    serializer_class = RegisterSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                "user": UserSerializer(user).data,
                "refresh": str(refresh),
                "access": str(refresh.access_token),
                "message": "User created successfully!",
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginAPI(generics.GenericAPIView):
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username=username, password=password)
        if user:
            refresh = RefreshToken.for_user(user)
            return Response({
                "user": UserSerializer(user).data,
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            })
        return Response({"error": "Invalid credentials"}, status=400)

class EventAPI(generics.ListCreateAPIView):
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Event.objects.filter(
            models.Q(creator=user) | 
            models.Q(family__members=user)
        ).distinct().order_by('start_time')

    def perform_create(self, serializer):
        user_family = self.request.user.families.first()
        serializer.save(creator=self.request.user, family=user_family)

class EventDetailAPI(RetrieveUpdateDestroyAPIView):
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]
    queryset = Event.objects.all()

    def get_queryset(self):
        user = self.request.user
        return Event.objects.filter(
            models.Q(creator=user) | 
            models.Q(family__members=user)
        ).distinct()

    def perform_update(self, serializer):
        serializer.save()

    def perform_destroy(self, instance):
        instance.delete()

class WeekEventsAPI(generics.ListAPIView):
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if start_date and end_date:
            try:
                start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
                end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
            except ValueError:
                return Event.objects.none()
        else:
            start_date = timezone.now() - timedelta(days=timezone.now().weekday())
            end_date = start_date + timedelta(days=7)
        
        return Event.objects.filter(
            (models.Q(creator=user) | models.Q(family__members=user)),
            start_time__date__range=(start_date, end_date)
        ).distinct().order_by('start_time')

class FamilyView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user

        if user.families.exists():
            return Response({'error' : 'Вы уже состоите в семье'}, status=400)
        
        name = request.data.get('name')
        if not name:
            return Response({'error': 'Необходимо указать название семьи'}, status=400)
        
        family = Family.objects.create(name=name, creator=user)
        family.members.add(user)

        serializer = FamilySerializer(family)
        return Response(serializer.data)

    def patch(self, request):
        user = request.user
        family = user.families.first()
        
        if not family:
            return Response(
                {'message': 'Вы не состоите ни в одной семье'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        family.members.remove(user)
        
        return Response(
            {'message': 'Вы успешно покинули семью'},
            status=status.HTTP_200_OK
        )

class FamilyMembersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        family = user.families.first()
        
        if not family:
            return Response({
                'has_family': False,
                'members': []
            })
        
        members = family.members.all()
        serializer = UserSerializer(members, many=True)
        return Response({
            'has_family': True,
            'members': serializer.data
        })

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Invitation
from .serializers import InvitationSerializer

class InvitationView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, invitation_id=None):
        if invitation_id is None:
            invitations = Invitation.objects.filter(
                recipient=request.user,
                status='pending'
            ).select_related('family', 'sender')
            serializer = InvitationSerializer(invitations, many=True)
            return Response(serializer.data)
        
        try:
            invitation = Invitation.objects.get(
                id=invitation_id,
                recipient=request.user,
                status__in=['pending', 'accepted', 'rejected']
            )
            serializer = InvitationSerializer(invitation)
            return Response(serializer.data)
        except Invitation.DoesNotExist:
            return Response(
                {'message': 'Приглашение не найдено'},
                status=status.HTTP_404_NOT_FOUND
            )

    def patch(self, request, invitation_id):
        action = request.data.get('action')

        try:
            invitation = Invitation.objects.get(
                id=invitation_id,
                recipient=request.user,
                status='pending'
            )

            if action == 'accept':
                invitation.family.members.add(request.user)
                invitation.status = 'accepted'
                invitation.save()
                return Response(
                    {'message': 'Приглашение принято'},
                    status=status.HTTP_200_OK
                )

            elif action == 'reject':
                invitation.status = 'rejected'
                invitation.save()
                return Response(
                    {'message': 'Приглашение отклонено'},
                    status=status.HTTP_200_OK
                )

            else:
                return Response(
                    {'message': 'Неверное действие (используйте "accept" или "reject")'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        except Invitation.DoesNotExist:
            return Response(
                {'message': 'Приглашение не найдено или уже обработано'},
                status=status.HTTP_404_NOT_FOUND
            )
        
    def post(self, request):
        email = request.data.get('email')
        username = request.data.get('username')

        if not email and not username:
            return Response(
                {'message': 'Укажите email или имя пользователя'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            if email:
                recipient = User.objects.get(email=email)
            elif username:
                recipient = User.objects.get(username=username)
            else:
                return Response(
                    {'message': 'Укажите email или имя пользователя'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except User.DoesNotExist:
            return Response(
                {'message': 'Пользователь не найден'},
                status=status.HTTP_404_NOT_FOUND
            )

        family = request.user.families.first()  
        if family.members.filter(id=recipient.id).exists():
            return Response(
                {'message': 'Этот пользователь уже в вашей семье'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if Invitation.objects.filter(family=family, recipient=recipient, status='pending').exists():
            return Response(
                {'message': 'Приглашение уже отправлено этому пользователю'},
                status=status.HTTP_400_BAD_REQUEST
            )

        invitation = Invitation.objects.create(
            family=family,
            sender=request.user,
            recipient=recipient,
            status='pending'
        )

        return Response(
            InvitationSerializer(invitation).data,
            status=status.HTTP_201_CREATED
        )

# class SendInvitationView(APIView):
#     permission_classes = [IsAuthenticated]

#     def post(self, request):
#         email = request.data.get('email')
#         username = request.data.get('username')

#         if not email and not username:
#             return Response(
#                 {'message': 'Укажите email или имя пользователя'},
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         try:
#             if email:
#                 recipient = User.objects.get(email=email)
#             elif username:
#                 recipient = User.objects.get(username=username)
#             else:
#                 return Response(
#                     {'message': 'Укажите email или имя пользователя'},
#                     status=status.HTTP_400_BAD_REQUEST
#                 )
#         except User.DoesNotExist:
#             return Response(
#                 {'message': 'Пользователь не найден'},
#                 status=status.HTTP_404_NOT_FOUND
#             )

#         family = request.user.families.first()  
#         if family.members.filter(id=recipient.id).exists():
#             return Response(
#                 {'message': 'Этот пользователь уже в вашей семье'},
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         if Invitation.objects.filter(family=family, recipient=recipient, status='pending').exists():
#             return Response(
#                 {'message': 'Приглашение уже отправлено этому пользователю'},
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         invitation = Invitation.objects.create(
#             family=family,
#             sender=request.user,
#             recipient=recipient,
#             status='pending'
#         )

#         return Response(
#             InvitationSerializer(invitation).data,
#             status=status.HTTP_201_CREATED
#         )
    
# class UserInvitationsView(APIView):
#     permission_classes = [IsAuthenticated]

#     def get(self, request):
#         invitations = Invitation.objects.filter(
#             recipient=request.user,
#             status='pending'
#         ).select_related('family', 'sender')
        
#         serializer = InvitationSerializer(invitations, many=True)
#         return Response(serializer.data)

# class AcceptInvitationView(APIView):
#     permission_classes = [IsAuthenticated]

#     def post(self, request, invitation_id):
#         try:
#             invitation = Invitation.objects.get(
#                 id=invitation_id,
#                 recipient=request.user,
#                 status='pending'
#             )
            
#             invitation.family.members.add(request.user)
#             invitation.status = 'accepted'
#             invitation.save()
            
#             return Response(
#                 {'message': 'Приглашение принято'},
#                 status=status.HTTP_200_OK
#             )
            
#         except Invitation.DoesNotExist:
#             return Response(
#                 {'message': 'Приглашение не найдено'},
#                 status=status.HTTP_404_NOT_FOUND
#             )

# class RejectInvitationView(APIView):
#     permission_classes = [IsAuthenticated]

#     def post(self, request, invitation_id):
#         try:
#             invitation = Invitation.objects.get(
#                 id=invitation_id,
#                 recipient=request.user,
#                 status='pending'
#             )
            
#             invitation.status = 'rejected'
#             invitation.save()
            
#             return Response(
#                 {'message': 'Приглашение отклонено'},
#                 status=status.HTTP_200_OK
#             )
            
#         except Invitation.DoesNotExist:
#             return Response(
#                 {'message': 'Приглашение не найдено'},
#                 status=status.HTTP_404_NOT_FOUND
#             )
    